// 导入模块
import { FileHandler } from './modules/FileHandler.js';
import { DataProcessor } from './modules/DataProcessor.js';
import { UIManager } from './modules/UIManager.js';
import { DataExporter } from './modules/DataExporter.js';
import { ColumnCalculator } from './modules/ColumnCalculator.js'; // 新增

console.log('🚀 App.js 开始加载...');

class ExcelManager {
    constructor() {
        this.excelData = [];
        this.filteredData = [];
        this.selectedColumns = [];
        this.availableColumns = [];
        
        // 初始化模块
        this.fileHandler = new FileHandler(this);
        this.dataProcessor = new DataProcessor(this);
        this.uiManager = new UIManager(this);
        this.dataExporter = new DataExporter(this);
        this.columnCalculator = new ColumnCalculator(this); // 新增
        
        this.init();
    }

    // 简化后的方法，委托给相应模块
    async handleFileUpload(event) {
        console.log('🎯 handleFileUpload 方法被调用');
        console.log('🎯 事件对象:', event);
        console.log('🎯 文件列表:', event.target.files);
        
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ 没有选择文件');
            return;
        }

        console.log('📁 文件信息:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        try {
            // 直接调用文件处理器，不使用委托
            if (this.fileHandler) {
                console.log('✅ 调用文件处理器');
                await this.fileHandler.handleFileUpload(event);
            } else {
                console.error('❌ 文件处理器未初始化');
                alert('文件处理器未初始化，请刷新页面重试');
            }
        } catch (error) {
            console.error('❌ 文件处理失败:', error);
            alert(`文件处理失败：${error.message}`);
        }
    }

    parseCSVData(text, filename, encoding) {
        return this.dataProcessor.parseCSVData(text, filename, encoding);
    }

    displayPreview(data) {
        return this.uiManager.displayPreview(data);
    }

    exportCSV() {
        return this.dataExporter.exportCSV();
    }

    exportExcel() {
        return this.dataExporter.exportExcel();
    }

    init() {
        console.log('🚀 初始化Excel管理器...');
        
        // 绑定文件处理事件
        this.fileHandler.bindEvents();
        
        // 初始化计算器
        this.columnCalculator.initCalculator(); // 新增
        
        this.bindUIEvents();
        
        console.log('✅ Excel管理器初始化完成');
    }

    bindUIEvents() {
        // 筛选按钮
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.handleFilter());
        }

        // 清除筛选按钮
        const clearFilterBtn = document.getElementById('clearFilterBtn');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => this.clearFilter());
        }

        // 导出按钮
        const exportCSVBtn = document.getElementById('exportCSVBtn');
        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => this.dataExporter.exportCSV());
        }

        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.dataExporter.exportExcel());
        }

        // 计算器切换按钮 - 新增
        const calcToggleBtn = document.getElementById('calcToggleBtn');
        if (calcToggleBtn) {
            calcToggleBtn.addEventListener('click', () => this.columnCalculator.toggleCalculator());
        }
    }

    // 文件加载完成后的回调
    onFileLoaded() {
        // 显示计算器
        const calculator = document.getElementById('columnCalculator');
        if (calculator) {
            calculator.style.display = 'block';
            this.columnCalculator.updateCalculatorOptions();
        }
    }

    // 文件上传组件功能
    
    // 添加读取文件为ArrayBuffer的方法
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
            
            reader.onabort = () => {
                reject(new Error('文件读取被中断'));
            };
            
            try {
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(new Error(`启动文件读取失败: ${error.message}`));
            }
        });
    }

    // 尝试多种编码读取CSV
    async tryReadCSVWithEncodings(file, encodings) {
        for (const encoding of encodings) {
            try {
                const text = await this.readFileAsText(file, encoding);
                
                // 简单验证：检查是否包含乱码
                if (!this.containsGarbledText(text)) {
                    return { text, encoding };
                }
            } catch (error) {
                console.log(`${encoding} 编码读取失败:`, error.message);
            }
        }
        
        throw new Error('无法用任何已知编码正确读取文件');
    }

    // 读取文件为文本
    readFileAsText(file, encoding = 'UTF-8') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error(`文件读取失败 (${encoding})`));
            reader.readAsText(file, encoding);
        });
    }

    // 检测乱码
    containsGarbledText(text) {
        // 检测常见的乱码字符
        const garbledPatterns = [
            /[\u00C0-\u00FF]{3,}/, // 连续的扩展ASCII字符
            /\uFFFD/,              // 替换字符
            /[àáâãäåæçèéêë]{3,}/   // 连续的重音字符
        ];
        
        return garbledPatterns.some(pattern => pattern.test(text));
    }

    // 改进CSV解析方法
    
    // 智能识别推荐列
    
    // 构建多选列选择器
    
    // 创建列复选框
    createColumnCheckbox(column, category, isRecommended) {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 4px; transition: background-color 0.2s;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col_${column}`;
        checkbox.value = column;
        checkbox.style.cssText = 'width: 16px; height: 16px;';
        
        const label = document.createElement('label');
        label.htmlFor = `col_${column}`;
        label.style.cssText = 'cursor: pointer; flex: 1; font-size: 14px; line-height: 1.4;';
        
        // 根据类别添加图标
        const categoryIcons = {
            'city': '🏙️',
            'date': '📅',
            'quantity': '🔢',
            'other': '📄'
        };
        
        const icon = categoryIcons[category] || categoryIcons['other'];
        const recommendedBadge = isRecommended ? ' <span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">推荐</span>' : '';
        
        label.innerHTML = `${icon} ${this.escapeHTML(column)}${recommendedBadge}`;
        
        // 添加事件监听
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!this.selectedColumns.includes(column)) {
                    this.selectedColumns.push(column);
                }
            } else {
                this.selectedColumns = this.selectedColumns.filter(col => col !== column);
            }
            this.updateSelectedCount();
            this.updateUI();
        });

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        
        // 悬停效果
        checkboxContainer.addEventListener('mouseenter', () => {
            checkboxContainer.style.backgroundColor = '#f0f0f0';
        });
        checkboxContainer.addEventListener('mouseleave', () => {
            checkboxContainer.style.backgroundColor = 'transparent';
        });

        return checkboxContainer;
    }

    // 按类别分组列
    groupColumnsByCategory() {
        const groups = {
            '🏙️ 地区相关': [],
            '📅 时间相关': [],
            '🔢 数量相关': [],
            '📄 其他列': []
        };

        this.availableColumns.forEach(column => {
            const category = this.getCategoryByColumn(column);
            switch (category) {
                case 'city':
                    groups['🏙️ 地区相关'].push(column);
                    break;
                case 'date':
                    groups['📅 时间相关'].push(column);
                    break;
                case 'quantity':
                    groups['🔢 数量相关'].push(column);
                    break;
                default:
                    groups['📄 其他列'].push(column);
            }
        });

        return groups;
    }

    // 获取列的类别
    getCategoryByColumn(column) {
        const cityKeywords = ['城市', '市', '地区', '区域', '所在地', '位置', '地址', 'city', 'location', 'address'];
        const dateKeywords = ['日期', '时间', '年', '月', '日', 'date', 'time', 'year', 'month', 'day'];
        const quantityKeywords = ['数量', '个数', '总数', '计数', '量', 'count', 'quantity', 'number', 'amount', '库存'];

        const lowerColumn = column.toLowerCase();
        
        if (cityKeywords.some(keyword => lowerColumn.includes(keyword.toLowerCase()))) {
            return 'city';
        }
        if (dateKeywords.some(keyword => lowerColumn.includes(keyword.toLowerCase()))) {
            return 'date';
        }
        if (quantityKeywords.some(keyword => lowerColumn.includes(keyword.toLowerCase()))) {
            return 'quantity';
        }
        
        return 'other';
    }

    updateUI() {
        return this.uiManager.updateUI();
    }

    // 添加全局方法供HTML调用
    selectAllColumns() {
        this.selectedColumns = [...this.availableColumns];
        this.updateCheckboxStates();
        this.updateSelectedCount();
        this.updateUI();
    }

    clearAllColumns() {
        this.selectedColumns = [];
        this.updateCheckboxStates();
        this.updateSelectedCount();
        this.updateUI();
    }

    selectRecommendedColumns() {
        const recommendedColumns = this.findRecommendedColumns();
        this.selectedColumns = recommendedColumns.map(rec => rec.column);
        this.updateCheckboxStates();
        this.updateSelectedCount();
        this.updateUI();
    }

    // 更新复选框状态
    updateCheckboxStates() {
        this.availableColumns.forEach(column => {
            const checkbox = document.getElementById(`col_${column}`);
            if (checkbox) {
                checkbox.checked = this.selectedColumns.includes(column);
            }
        });
    }

    // 更新选择计数
    updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedColumns.length;
        }
    }

    // 增强的CSV行解析
    
    // 显示数据统计
    showDataStats(columns, rows) {
        const dataStats = document.getElementById('dataStats');
        const totalRows = document.getElementById('totalRows');
        const totalColumns = document.getElementById('totalColumns');
        const cityColumn = document.getElementById('cityColumn');
        
        if (totalRows) totalRows.textContent = rows;
        if (totalColumns) totalColumns.textContent = columns;
        if (cityColumn) {
            const selectedText = this.selectedColumns.length > 0 ? 
                `已选 ${this.selectedColumns.length} 列` : '未选择';
            cityColumn.textContent = selectedText;
            cityColumn.style.color = this.selectedColumns.length > 0 ? '#4CAF50' : '#f44336';
        }
        if (dataStats) dataStats.style.display = 'block';
    }

    // 数据筛选功能 - 支持多列筛选
    handleFilter() {
        const cityInput = document.getElementById('cityInput');
        const searchValue = cityInput ? cityInput.value.trim() : '';
        
        if (!searchValue) {
            this.showStatus('filterStatus', '请输入要筛选的值！', 'error');
            cityInput?.focus();
            return;
        }
        
        if (this.excelData.length === 0) {
            this.showStatus('filterStatus', '请先上传文件！', 'error');
            return;
        }
        
        if (this.selectedColumns.length === 0) {
            this.showStatus('filterStatus', '请先选择要筛选的列！', 'error');
            return;
        }
        
        // 获取匹配模式
        const matchModeRadio = document.querySelector('input[name="matchMode"]:checked');
        const matchMode = matchModeRadio ? matchModeRadio.value : 'exact';
        
        // 获取是否启用多项搜索
        const multiSearchCheckbox = document.getElementById('multiSearch');
        const isMultiSearch = multiSearchCheckbox ? multiSearchCheckbox.checked : false;
        
        // 获取逻辑模式（AND/OR）
        const logicModeRadio = document.querySelector('input[name="logicMode"]:checked');
        const logicMode = logicModeRadio ? logicModeRadio.value : 'or';
        
        // 处理搜索词 - 支持中英文逗号
        let searchTerms = [];
        if (isMultiSearch) {
            // 多项搜索：支持中文逗号（，）和英文逗号（,）
            searchTerms = searchValue
                .split(/[,，]/)  // 使用正则表达式同时匹配中英文逗号
                .map(term => term.trim())
                .filter(term => term.length > 0);
                
            if (searchTerms.length === 0) {
                this.showStatus('filterStatus', '请输入有效的搜索词！', 'error');
                return;
            }
            
            console.log('🔍 检测到的搜索词:', searchTerms);
        } else {
            // 单项搜索
            searchTerms = [searchValue];
        }
        
        console.log('🔍 搜索参数:', { matchMode, isMultiSearch, logicMode, searchTerms });
        
        // 执行筛选 - 根据逻辑模式使用不同的筛选策略
        this.filteredData = this.excelData.filter(row => {
            if (isMultiSearch && logicMode === 'and') {
                // AND模式：所有搜索词都必须匹配
                return searchTerms.every(searchTerm => {
                    return this.selectedColumns.some(column => {
                        const cellValue = row[column];
                        if (!cellValue) return false;
                        
                        const cellStr = cellValue.toString();
                        return this.matchValue(cellStr, searchTerm, matchMode);
                    });
                });
            } else {
                // OR模式：任一搜索词匹配即可（默认模式）
                return this.selectedColumns.some(column => {
                    const cellValue = row[column];
                    if (!cellValue) return false;
                    
                    const cellStr = cellValue.toString();
                    
                    return searchTerms.some(searchTerm => {
                        return this.matchValue(cellStr, searchTerm, matchMode);
                    });
                });
            }
        });
        
        // 显示结果
        if (this.filteredData.length > 0) {
            const modeDescriptions = {
                'exact': '精确匹配（完全相等）',
                'exactIgnoreCase': '精确匹配（忽略大小写）',
                'contains': '包含匹配（广义搜索）',
                'containsIgnoreCase': '包含匹配（忽略大小写）'
            };
            
            const logicDescriptions = {
                'or': 'OR模式（任一条件满足）',
                'and': 'AND模式（所有条件都要满足）'
            };
            
            const searchDescription = isMultiSearch ? 
                `多项搜索（${logicDescriptions[logicMode]}）：${searchTerms.join('、')}` : 
                `单项搜索：${searchValue}`;
            
            this.showStatus('filterStatus', 
                `🎉 筛选完成！找到 ${this.filteredData.length} 条数据\n\n` +
                `${searchDescription}\n` +
                `匹配模式：${modeDescriptions[matchMode]}\n` +
                `筛选列：${this.selectedColumns.join('、')}`, 
                'success'
            );
            this.displayPreview(this.filteredData.slice(0, 10));
            this.updateUI();
        } else {
            const logicDescriptions = {
                'or': 'OR模式（任一条件满足）',
                'and': 'AND模式（所有条件都要满足）'
            };
            
            this.showStatus('filterStatus', 
                `😔 未找到匹配的数据！\n\n` +
                `搜索词：${searchTerms.join('、')}\n` +
                `搜索逻辑：${isMultiSearch ? logicDescriptions[logicMode] : '单项搜索'}\n` +
                `匹配模式：${modeDescriptions[matchMode] || matchMode}\n` +
                `已搜索列：${this.selectedColumns.join('、')}`, 
                'error'
            );
            this.clearResults();
            this.updateUI();
        }
    }

    clearFilter() {
        this.filteredData = [];
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
            cityInput.value = '';
        }
        this.showStatus('filterStatus', '✅ 筛选已清除，显示全部数据', 'success');
        this.displayPreview(this.excelData.slice(0, 10));
        this.updateUI();
    }

    // 导出CSV功能
    
    // 获取导出文件名
    getExportFilename(extension) {
        const filenameInput = document.getElementById('filenameInput');
        let filename = filenameInput ? filenameInput.value.trim() : '';
        
        if (!filename) {
            const cityInput = document.getElementById('cityInput');
            const searchValue = cityInput ? cityInput.value.trim() : '';
            
            if (searchValue && this.filteredData.length > 0) {
                filename = `${searchValue}_筛选数据`;
            } else {
                filename = '数据导出';
            }
        }
        
        // 确保文件名安全
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        return `${filename}.${extension}`;
    }

    // 生成CSV内容
    generateCSVContent(data, onlySelectedColumns = false) {
        if (data.length === 0) return '';
        
        // 确定要导出的列
        const columnsToExport = onlySelectedColumns && this.selectedColumns.length > 0 
            ? this.selectedColumns 
            : Object.keys(data[0]);
        
        let csvContent = '';
        
        // 添加BOM以支持中文
        csvContent += '\uFEFF';
        
        // 添加标题行
        csvContent += columnsToExport.map(header => this.escapeCSVField(header)).join(',') + '\n';
        
        // 添加数据行
        data.forEach(row => {
            const values = columnsToExport.map(column => {
                const value = row[column] || '';
                return this.escapeCSVField(value.toString());
            });
            csvContent += values.join(',') + '\n';
        });
        
        return csvContent;
    }

    // 生成Excel兼容的CSV
    generateExcelCompatibleCSV(data, onlySelectedColumns = false) {
        return this.generateCSVContent(data, onlySelectedColumns);
    }

    // CSV字段转义
    escapeCSVField(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }

    // HTML转义防止XSS
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 下载文件
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // 添加缺失的showStatus方法
    showStatus(elementId, message, type) {
        const statusElement = document.getElementById(elementId);
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';
            
            // 自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
        }
        console.log(`[${type.toUpperCase()}] ${elementId}:`, message);
    }

    // 添加缺失的hideAllStatus方法
    hideAllStatus() {
        const statusElements = ['fileStatus', 'filterStatus', 'exportStatus'];
        statusElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // 添加缺失的clearResults方法
    clearResults() {
        const results = document.getElementById('results');
        const dataPreview = document.getElementById('dataPreview');
        
        if (results) {
            results.style.display = 'none';
        }
        if (dataPreview) {
            dataPreview.innerHTML = '';
        }
        
        // 隐藏数据统计
        const dataStats = document.getElementById('dataStats');
        if (dataStats) {
            dataStats.style.display = 'none';
        }
        
        // 隐藏文件信息
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        // 隐藏列选择器
        const columnSelector = document.getElementById('columnSelector');
        if (columnSelector) {
            columnSelector.style.display = 'none';
        }
    }

    // 添加缺失的checkXLSXLibrary方法
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

    // 匹配方法
    matchValue(cellValue, searchTerm, matchMode) {
        switch (matchMode) {
            case 'exact':
                return cellValue.trim() === searchTerm.trim();
            case 'exactIgnoreCase':
                return cellValue.trim().toLowerCase() === searchTerm.trim().toLowerCase();
            case 'contains':
                return cellValue.includes(searchTerm);
            case 'containsIgnoreCase':
                return cellValue.toLowerCase().includes(searchTerm.toLowerCase());
            default:
                return cellValue.trim() === searchTerm.trim();
        }
    }
}

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 页面加载完成，开始初始化...');
    
    // 检查XLSX库
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX库未加载');
        alert('XLSX库加载失败，请刷新页面重试');
        return;
    }
    
    try {
        // 立即初始化，不要延迟
        console.log('⏰ 创建Excel管理器实例...');
        const app = new ExcelManager();
        window.excelManagerInstance = app;
        
        // 测试文件输入元素
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            console.log('✅ 文件输入元素已找到');
            
            // 直接测试事件绑定
            fileInput.addEventListener('change', (e) => {
                console.log('🎯 文件输入change事件触发 - 直接绑定');
                if (e.target.files && e.target.files[0]) {
                    console.log('📁 选择的文件:', e.target.files[0].name);
                    app.handleFileUpload(e);
                }
            });
            
            console.log('✅ 文件输入事件绑定成功');
        } else {
            console.error('❌ 未找到文件输入元素');
        }
        
        // 多项搜索复选框事件
        const multiSearchCheckbox = document.getElementById('multiSearch');
        const logicModeSelector = document.getElementById('logicModeSelector');
        
        if (multiSearchCheckbox && logicModeSelector) {
            // 初始化显示状态 - 根据多项搜索复选框的初始状态
            const updateLogicModeVisibility = () => {
                logicModeSelector.style.display = multiSearchCheckbox.checked ? 'block' : 'none';
            };
            
            // 设置初始状态
            updateLogicModeVisibility();
            
            // 监听多项搜索复选框变化
            multiSearchCheckbox.addEventListener('change', updateLogicModeVisibility);
            
            console.log('✅ 多项搜索和逻辑模式选择器事件绑定成功');
        }
        
        console.log('✅ Excel管理器初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        alert(`初始化失败：${error.message}`);
    }
});

window.addEventListener('load', () => {
    console.log('🎯 窗口加载完成，所有资源已准备就绪');
});

window.addEventListener('beforeunload', (e) => {
    const excelManager = window.excelManagerInstance;
    if (excelManager && excelManager.excelData.length > 0) {
        e.preventDefault();
        // 使用现代方法替代已弃用的returnValue
        const confirmationMessage = '您有未保存的数据，确定要离开吗？';
        (e || window.event).returnValue = confirmationMessage; // 兼容旧浏览器
        return confirmationMessage; // 现代浏览器
    }
});