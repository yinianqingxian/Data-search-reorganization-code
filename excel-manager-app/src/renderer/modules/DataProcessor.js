export class DataProcessor {
    constructor(excelManager) {
        this.excelManager = excelManager;
    }

    parseCSVData(text, filename, encoding = '自动检测') {
        console.log('📄 开始解析CSV数据，编码:', encoding, '长度:', text.length);
        try {
            // 处理不同的BOM和换行符
            let cleanText = text;
            
            // 移除各种BOM标记
            cleanText = cleanText.replace(/^\uFEFF/, '');  // UTF-8 BOM
            cleanText = cleanText.replace(/^\uFFFE/, '');  // UTF-16 LE BOM
            cleanText = cleanText.replace(/^\u0000\uFEFF/, ''); // UTF-32 BE BOM
            
            // 统一换行符
            cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            // 移除文件末尾的多余空行
            cleanText = cleanText.replace(/\n+$/, '');
            
            const lines = cleanText.split('\n').filter(line => line.trim());
            console.log('📄 处理后有效行数:', lines.length);
            
            if (lines.length < 1) {
                throw new Error('CSV文件为空或只包含空行！');
            }
            
            if (lines.length < 2) {
                throw new Error('CSV文件内容不足！至少需要标题行和一行数据。');
            }

            // 解析标题行
            const headers = this.parseCSVLine(lines[0]);
            console.log('📄 检测到列标题:', headers);

            if (headers.length === 0) {
                throw new Error('未找到有效的列标题！');
            }

            // 检查标题是否包含乱码
            const hasGarbledHeaders = headers.some(header => 
                !header || /�/.test(header) || /[\u00C0-\u00FF]{3,}/.test(header)
            );
            
            if (hasGarbledHeaders) {
                console.warn('⚠️ 标题行可能包含乱码，建议使用UTF-8编码保存文件');
            }

            // 存储可用列
            this.excelManager.availableColumns = headers;

            // 解析数据行
            this.excelManager.excelData = [];
            let successfulRows = 0;
            let failedRows = 0;
            let garbledRows = 0;
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    try {
                        const values = this.parseCSVLine(lines[i]);
                        const row = {};
                        let hasGarbledData = false;
                        
                        headers.forEach((header, index) => {
                            const value = values[index] || '';
                            row[header] = value;
                            
                            // 检查数据是否包含乱码
                            if (value && (/�/.test(value) || /[\u00C0-\u00FF]{3,}/.test(value))) {
                                hasGarbledData = true;
                            }
                        });
                        
                        if (hasGarbledData) {
                            garbledRows++;
                            console.warn(`⚠️ 第 ${i + 1} 行包含可能的乱码数据`);
                        }
                        
                        this.excelManager.excelData.push(row);
                        successfulRows++;
                    } catch (lineError) {
                        console.warn(`📄 第 ${i + 1} 行解析失败:`, lineError.message);
                        failedRows++;
                    }
                }
            }
            
            console.log('📄 数据解析完成:', {
                成功: successfulRows,
                失败: failedRows,
                乱码行: garbledRows
            });
            
            // 数据验证
            const validRows = this.excelManager.excelData.filter(row => {
                return Object.values(row).some(value => 
                    value && value.toString().trim() && value.toString().trim() !== ''
                );
            });

            if (validRows.length === 0) {
                throw new Error('CSV文件中没有有效数据！');
            }

            this.excelManager.excelData = validRows;
            
            // 智能识别推荐列
            const recommendedColumns = this.findRecommendedColumns();
            this.excelManager.uiManager.buildMultiColumnSelector(recommendedColumns);
            
            let successMessage = `✅ CSV文件 "${filename}" 加载成功！\n编码: ${encoding}\n数据: ${this.excelManager.excelData.length} 行有效数据，${headers.length} 列`;
            
            if (failedRows > 0) {
                successMessage += `\n注意: ${failedRows} 行数据解析失败已跳过`;
            }
            
            if (garbledRows > 0) {
                successMessage += `\n⚠️ ${garbledRows} 行可能包含乱码，建议使用UTF-8编码重新保存文件`;
            }
            
            this.excelManager.showStatus('fileStatus', successMessage, garbledRows > 0 ? 'info' : 'success');
            this.excelManager.showDataStats(headers.length, this.excelManager.excelData.length);
            this.excelManager.uiManager.displayPreview(this.excelManager.excelData.slice(0, 5));
            this.excelManager.uiManager.updateUI();
            
        } catch (error) {
            console.error('❌ CSV解析失败:', error);
            this.excelManager.showStatus('fileStatus', 
                `❌ CSV解析失败：${error.message}\n\n` +
                '解决编码问题的方案：\n' +
                '1. 用Excel打开CSV文件 → 另存为 → CSV UTF-8格式\n' +
                '2. 用记事本打开 → 另存为 → 编码选择UTF-8\n' +
                '3. 确保文件不包含特殊字符或控制字符\n' +
                '4. 如果是从Excel导出，请选择"CSV UTF-8(逗号分隔)"格式', 
                'error'
            );
        }
    }

    parseCSVLine(line) {
        const result = [];
        let inQuotes = false;
        let current = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 双引号转义
                    current += '"';
                    i++; // 跳过下一个引号
                } else {
                    // 切换引号状态
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 字段分隔符
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // 添加最后一个字段
        result.push(current.trim());
        
        return result;
    }

    findRecommendedColumns() {
        const recommendedColumns = [];
        
        this.excelManager.availableColumns.forEach(column => {
            const category = this.getCategoryByColumn(column);
            if (category !== 'other') {
                recommendedColumns.push({ column, category });
            }
        });
        
        return recommendedColumns;
    }

    getCategoryByColumn(column) {
        const columnLower = column.toLowerCase();
        
        // 地区相关
        const cityKeywords = ['城市', 'city', '地区', '地址', 'address', '省', 'province', '市', '区', 'district'];
        if (cityKeywords.some(keyword => columnLower.includes(keyword))) {
            return 'city';
        }
        
        // 时间相关
        const dateKeywords = ['日期', 'date', '时间', 'time', '年', 'year', '月', 'month', '天', 'day'];
        if (dateKeywords.some(keyword => columnLower.includes(keyword))) {
            return 'date';
        }
        
        // 数量相关
        const quantityKeywords = ['数量', 'quantity', '金额', 'amount', '价格', 'price', '总计', 'total', '合计', 'sum'];
        if (quantityKeywords.some(keyword => columnLower.includes(keyword))) {
            return 'quantity';
        }
        
        return 'other';
    }
}