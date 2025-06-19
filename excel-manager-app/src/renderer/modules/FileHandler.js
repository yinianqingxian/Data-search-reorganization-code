export class FileHandler {
    constructor(excelManager) {
        this.excelManager = excelManager;
    }

    async handleFileUpload(event) {
        console.log('🎯 handleFileUpload 被调用');
        
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ 没有选择文件');
            return;
        }

        console.log('📁 文件详情:', {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        });

        // 显示处理中状态
        this.excelManager.showStatus('fileStatus', '📋 正在处理文件...', 'info');

        // 重置之前的数据
        this.excelManager.excelData = [];
        this.excelManager.filteredData = [];
        this.excelManager.selectedColumns = [];
        this.excelManager.availableColumns = [];
        this.excelManager.clearResults();
        this.excelManager.hideAllStatus();

        // 显示文件信息
        this.showFileInfo(file);

        const fileName = file.name.toLowerCase();
        console.log('📄 文件扩展名检查:', fileName);
        
        try {
            if (fileName.endsWith('.csv')) {
                console.log('📄 开始处理CSV文件');
                this.handleCSVFile(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                console.log('📊 开始处理Excel文件');
                
                // 检查XLSX库
                try {
                    await this.checkXLSXLibrary();
                    await this.handleExcelFile(file);
                } catch (error) {
                    console.error('❌ Excel处理失败:', error);
                    this.excelManager.showStatus('fileStatus', 
                        `❌ Excel处理库加载失败\n\n` +
                        `错误: ${error.message}\n\n` +
                        `解决方案:\n` +
                        `1. 刷新页面重试\n` +
                        `2. 检查网络连接\n` +
                        `3. 使用CSV格式上传`, 
                        'error'
                    );
                }
            } else {
                console.log('❌ 不支持的文件格式');
                this.excelManager.showStatus('fileStatus', 
                    '❌ 不支持的文件格式！\n\n' +
                    '支持的格式:\n' +
                    '• Excel文件: .xlsx, .xls\n' +
                    '• CSV文件: .csv', 
                    'error'
                );
            }
        } catch (error) {
            console.error('❌ 文件处理失败:', error);
            this.excelManager.showStatus('fileStatus', 
                `❌ 文件处理失败\n\n错误: ${error.message}`, 
                'error'
            );
        }
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileDetails = document.getElementById('fileDetails');
        
        if (fileInfo && fileDetails) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            const lastModified = new Date(file.lastModified).toLocaleString();
            
            fileDetails.innerHTML = `
                <div style="margin-top: 10px;">
                    <div>📄 文件名: ${this.excelManager.escapeHTML(file.name)}</div>
                    <div>💾 大小: ${sizeInMB} MB</div>
                    <div>🕒 修改时间: ${lastModified}</div>
                    <div>📋 类型: ${file.type || '未知'}</div>
                </div>
            `;
            fileInfo.style.display = 'block';
        }
    }

    handleCSVFile(file) {
        console.log('📄 开始处理CSV文件');
        this.excelManager.showStatus('fileStatus', '📄 正在读取CSV文件...', 'info');
        
        this.tryReadCSVWithEncodings(file, ['UTF-8', 'GBK', 'GB2312'])
            .then(({text, encoding}) => {
                console.log(`✅ 使用 ${encoding} 编码成功读取CSV文件`);
                this.excelManager.dataProcessor.parseCSVData(text, file.name, encoding);
            })
            .catch(error => {
                console.error('❌ CSV读取失败:', error);
                this.excelManager.showStatus('fileStatus', 
                    '❌ 中文CSV文件读取失败！\n\n' +
                    '解决方案：\n' +
                    '1. 用Excel打开CSV文件\n' +
                    '2. 另存为 → CSV UTF-8格式\n' +
                    '3. 重新上传文件\n\n' +
                    `错误详情：${error.message}`, 
                    'error'
                );
            });
    }

    // 修复tryReadCSVWithEncodings方法
    async tryReadCSVWithEncodings(file, encodings) {
        const encodingsToTry = ['UTF-8', 'GBK', 'GB2312', 'GB18030', 'BIG5'];
        
        for (const encoding of encodingsToTry) {
            try {
                console.log(`🔍 尝试使用 ${encoding} 编码读取文件...`);
                const text = await this.readFileAsText(file, encoding);
                
                // 改进的乱码检测
                if (!this.containsGarbledText(text) && this.isValidCSVContent(text)) {
                    console.log(`✅ ${encoding} 编码读取成功`);
                    return { text, encoding };
                } else {
                    console.log(`❌ ${encoding} 编码包含乱码或格式错误`);
                }
            } catch (error) {
                console.log(`❌ ${encoding} 编码读取失败:`, error.message);
            }
        }
        
        // 如果所有编码都失败，尝试自动检测
        try {
            console.log('🔍 尝试浏览器自动检测编码...');
            const text = await this.readFileAsTextAuto(file);
            if (text && text.length > 0) {
                return { text, encoding: '自动检测' };
            }
        } catch (error) {
            console.log('❌ 自动检测失败:', error.message);
        }
        
        throw new Error('无法用任何编码正确读取文件，请确保文件编码为UTF-8、GBK或GB2312');
    }

    readFileAsText(file, encoding = 'UTF-8') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target.result;
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error(`文件读取结果为空 (${encoding})`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error(`文件读取失败 (${encoding}): ${reader.error?.message || '未知错误'}`));
            };
            
            // 使用指定编码读取
            try {
                reader.readAsText(file, encoding);
            } catch (error) {
                reject(new Error(`启动文件读取失败 (${encoding}): ${error.message}`));
            }
        });
    }

    // 第165行 - 添加自动检测编码方法
    readFileAsTextAuto(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target.result;
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error('自动检测读取结果为空'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error(`自动检测读取失败: ${reader.error?.message || '未知错误'}`));
            };
            
            // 让浏览器自动检测编码
            reader.readAsText(file);
        });
    }

    // 第185行 - 改进乱码检测方法
    containsGarbledText(text) {
        if (!text || text.length === 0) return true;
        
        // 检测常见的乱码模式
        const garbledPatterns = [
            /�{2,}/,                          // 连续的替换字符
            /[\u00C0-\u00FF]{5,}/,           // 连续的扩展ASCII字符
            /[àáâãäåæçèéêë]{4,}/,            // 连续的重音字符
            /\uFFFD/,                        // Unicode替换字符
            /[ÄÖÜ]{3,}/,                     // 连续的德语变音字符
            /[âêîôû]{3,}/,                   // 连续的法语字符
        ];
        
        // 检查是否包含乱码模式
        const hasGarbledChars = garbledPatterns.some(pattern => pattern.test(text));
        
        if (hasGarbledChars) {
            console.log('🚨 检测到乱码字符');
            return true;
        }
        
        // 检查中文字符比例（如果文件应该包含中文）
        const chineseChars = text.match(/[\u4e00-\u9fff]/g);
        const totalChars = text.length;
        
        if (totalChars > 100) {
            const chineseRatio = chineseChars ? chineseChars.length / totalChars : 0;
            
            // 如果文件名包含中文相关词汇，但中文字符比例很低，可能是编码问题
            const fileName = text.substring(0, 200).toLowerCase();
            const hasChinese = /[\u4e00-\u9fff]/.test(fileName);
            
            if (hasChinese && chineseRatio < 0.01) {
                console.log('🚨 中文字符比例异常低，可能存在编码问题');
                return true;
            }
        }
        
        return false;
    }

    checkXLSXLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                console.log('✅ XLSX库已加载，版本:', XLSX.version);
                resolve(true);
                return;
            }
            
            // 尝试重新加载XLSX库
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                if (typeof XLSX !== 'undefined') {
                    console.log('✅ XLSX库重新加载成功');
                    resolve(true);
                } else {
                    reject(new Error('XLSX库加载后仍不可用'));
                }
            };
            script.onerror = () => {
                reject(new Error('XLSX库加载失败，请检查网络连接'));
            };
            
            document.head.appendChild(script);
            
            // 10秒超时
            setTimeout(() => {
                reject(new Error('XLSX库加载超时'));
            }, 10000);
        });
    }

    // 修复handleExcelFile方法
    async handleExcelFile(file) {
        this.excelManager.showStatus('fileStatus', '📊 正在读取Excel文件...', 'info');
        
        try {
            // 检查XLSX库是否可用
            if (typeof XLSX === 'undefined') {
                throw new Error('Excel处理库未加载，请刷新页面重试');
            }

            console.log('📊 开始读取Excel文件:', file.name);
            
            // 使用SheetJS读取Excel
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log('📊 文件读取完成，大小:', arrayBuffer.byteLength, 'bytes');
            
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellText: false,
                cellDates: true,
                dateNF: 'YYYY-MM-DD'
            });
            
            console.log('📊 工作簿解析完成，工作表:', workbook.SheetNames);
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel文件中没有找到工作表');
            }
            
            // 获取第一个工作表
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            if (!worksheet) {
                throw new Error(`无法读取工作表: ${sheetName}`);
            }
            
            console.log('📊 使用工作表:', sheetName);
            
            // 转换为JSON格式，保留空单元格
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',  // 空单元格默认值
                raw: false   // 不使用原始值，转换为字符串
            });
            
            console.log('📊 原始数据行数:', jsonData.length);
            
            if (jsonData.length < 1) {
                throw new Error('Excel文件中没有数据');
            }
            
            // 处理标题行
            const rawHeaders = jsonData[0] || [];
            const headers = rawHeaders
                .map((header, index) => {
                    // 处理空标题
                    if (!header || header.toString().trim() === '') {
                        return `列${index + 1}`;
                    }
                    return header.toString().trim();
                })
                .filter(header => header !== '');
            
            console.log('📊 处理后的标题:', headers);
            
            if (headers.length === 0) {
                throw new Error('Excel文件中没有有效的列标题');
            }
            
            // 处理数据行
            const dataRows = jsonData.slice(1).filter(row => {
                // 过滤完全空行
                return row && row.some(cell => 
                    cell !== undefined && 
                    cell !== null && 
                    cell.toString().trim() !== ''
                );
            });
            
            console.log('📊 有效数据行数:', dataRows.length);
            
            if (dataRows.length === 0) {
                throw new Error('Excel文件中没有有效数据行');
            }
            
            // 转换为对象格式
            this.excelManager.excelData = dataRows.map((row, rowIndex) => {
                const obj = {};
                headers.forEach((header, colIndex) => {
                    const cellValue = row[colIndex];
                    
                    // 处理各种数据类型
                    if (cellValue === undefined || cellValue === null) {
                        obj[header] = '';
                    } else if (typeof cellValue === 'number') {
                        obj[header] = cellValue.toString();
                    } else if (cellValue instanceof Date) {
                        obj[header] = cellValue.toLocaleDateString();
                    } else {
                        obj[header] = cellValue.toString().trim();
                    }
                });
                return obj;
            });
            
            console.log('📊 转换完成，最终数据行数:', this.excelManager.excelData.length);
            
            // 验证转换结果
            if (this.excelManager.excelData.length === 0) {
                throw new Error('数据转换后没有有效记录');
            }
            
            // 修复这些方法调用
            this.excelManager.availableColumns = headers;
            
            // 智能识别推荐列
            const recommendedColumns = this.excelManager.dataProcessor.findRecommendedColumns();
            this.excelManager.uiManager.buildMultiColumnSelector(recommendedColumns);
            
            this.excelManager.showStatus('fileStatus', 
                `✅ Excel文件读取成功！\n\n` +
                `📄 文件: ${file.name}\n` +
                `📊 工作表: ${sheetName}\n` +
                `📈 数据: ${this.excelManager.excelData.length} 行，${headers.length} 列\n` +
                `🎯 推荐列: ${recommendedColumns.length} 个`, 
                'success'
            );
            
            this.excelManager.showDataStats(headers.length, this.excelManager.excelData.length);
            this.excelManager.uiManager.displayPreview(this.excelManager.excelData.slice(0, 5));
            this.excelManager.uiManager.updateUI();
            
        } catch (error) {
            console.error('❌ Excel文件读取失败:', error);
            
            let errorMessage = error.message;
            let suggestions = [];
            
            // 根据错误类型提供具体建议
            if (error.message.includes('处理库未加载')) {
                suggestions = [
                    '1. 刷新页面重试',
                    '2. 检查网络连接',
                    '3. 尝试使用CSV格式'
                ];
            } else if (error.message.includes('工作表') || error.message.includes('没有数据')) {
                suggestions = [
                    '1. 确保Excel文件不为空',
                    '2. 检查是否有隐藏的工作表',
                    '3. 尝试另存为新的Excel文件'
                ];
            } else if (error.message.includes('列标题')) {
                suggestions = [
                    '1. 确保第一行包含列标题',
                    '2. 检查是否有合并单元格',
                    '3. 尝试删除空行和空列'
                ];
            } else {
                suggestions = [
                    '1. 确保文件未被其他程序占用',
                    '2. 尝试另存为.xlsx格式',
                    '3. 或转换为CSV格式后上传',
                    '4. 检查文件是否损坏'
                ];
            }
            
            // 修复错误调用：应该是 this.excelManager.showStatus
            this.excelManager.showStatus('fileStatus', 
                `❌ Excel文件读取失败\n\n` +
                `错误信息: ${errorMessage}\n\n` +
                `解决建议:\n${suggestions.join('\n')}`, 
                'error'
            );
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('没有选择文件'));
                return;
            }
            
            if (file.size === 0) {
                reject(new Error('文件大小为0，可能是空文件'));
                return;
            }
            
            if (file.size > 50 * 1024 * 1024) { // 50MB限制
                reject(new Error('文件太大（超过50MB），请使用较小的文件'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (e.target.result) {
                    resolve(e.target.result);
                } else {
                    reject(new Error('文件读取结果为空'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error(`文件读取失败: ${reader.error?.message || '未知错误'}`));
            };
            
            // 读取文件为ArrayBuffer
            reader.readAsArrayBuffer(file);
        });
    }
}