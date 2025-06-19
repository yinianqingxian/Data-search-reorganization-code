export class DataExporter {
    constructor(excelManager) {
        this.excelManager = excelManager;
    }

    // 修复属性访问方法
    get excelData() {
        return this.excelManager.excelData;
    }

    get filteredData() {
        return this.excelManager.filteredData;
    }

    get selectedColumns() {
        return this.excelManager.selectedColumns;
    }

    exportCSV() {
        const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.excelData;
        
        if (dataToExport.length === 0) {
            this.showStatus('exportStatus', '❌ 没有可导出的数据！请先上传文件。', 'error');
            return;
        }
        
        // 检查是否有选中的列
        if (this.selectedColumns.length === 0) {
            this.showStatus('exportStatus', '❌ 请先选择要导出的列！', 'error');
            return;
        }
        
        try {
            const filename = this.getExportFilename('csv');
            // 只生成选中列的CSV内容
            const csvContent = this.generateSelectedColumnsCSV(dataToExport);
            this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8-bom;');
            
            const dataType = this.filteredData.length > 0 ? '筛选后的' : '全部';
            this.showStatus('exportStatus', 
                `🎉 成功导出 ${dataToExport.length} 条${dataType}数据！\n` +
                `文件名：${filename}\n` +
                `导出列：${this.selectedColumns.join('、')}\n` +
                `共 ${this.selectedColumns.length} 列`, 
                'success'
            );
            
        } catch (error) {
            this.showStatus('exportStatus', '❌ 导出失败！请重试。', 'error');
            console.error('导出错误:', error);
        }
    }

    // Excel导出功能
    exportExcel() {
        const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.excelData;
        
        if (dataToExport.length === 0) {
            this.showStatus('exportStatus', '❌ 没有可导出的数据！', 'error');
            return;
        }
        
        // 检查是否有选中的列
        if (this.selectedColumns.length === 0) {
            this.showStatus('exportStatus', '❌ 请先选择要导出的列！', 'error');
            return;
        }
        
        try {
            const filename = this.getExportFilename('xlsx').replace('.xlsx', '.csv');
            // 只生成选中列的Excel兼容CSV内容
            const csvContent = this.generateSelectedColumnsExcelCSV(dataToExport);
            this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8-bom;');
            
            this.showStatus('exportStatus', 
                `📊 已导出为Excel兼容的CSV文件！\n` +
                `文件名：${filename}\n` +
                `导出列：${this.selectedColumns.join('、')}\n` +
                `共 ${this.selectedColumns.length} 列\n\n` +
                `💡 可以直接用Excel打开此文件`, 
                'success'
            );
            
        } catch (error) {
            this.showStatus('exportStatus', '❌ 导出失败！', 'error');
            console.error('Excel导出错误:', error);
        }
    }

    generateSelectedColumnsCSV(data) {
        if (data.length === 0 || this.selectedColumns.length === 0) return '';
        
        let csvContent = '';
        
        // 添加BOM以支持中文
        csvContent += '\uFEFF';
        
        // 添加选中列的标题行
        csvContent += this.selectedColumns.map(header => this.escapeCSVField(header)).join(',') + '\n';
        
        // 添加数据行（只包含选中的列）
        data.forEach(row => {
            const values = this.selectedColumns.map(column => {
                const value = row[column] || '';
                return this.escapeCSVField(value.toString());
            });
            csvContent += values.join(',') + '\n';
        });
        
        return csvContent;
    }

    // 新增：生成只包含选中列的Excel兼容CSV
    generateSelectedColumnsExcelCSV(data) {
        return this.generateSelectedColumnsCSV(data);
    }

    // 获取导出文件名
    getExportFilename(extension) {
        const filenameInput = document.getElementById('filenameInput');
        let filename = filenameInput ? filenameInput.value.trim() : '';
        
        if (!filename) {
            const cityInput = document.getElementById('cityInput');
            const searchValue = cityInput ? cityInput.value.trim() : '';
            
            if (searchValue && this.excelManager.filteredData.length > 0) {
                filename = `${searchValue}_筛选数据`;
            } else {
                filename = '数据导出';
            }
        }
        
        // 确保文件名安全
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        return `${filename}.${extension}`;
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

    // CSV字段转义
    escapeCSVField(field) {
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }

    // 显示状态
    showStatus(elementId, message, type) {
        return this.excelManager.showStatus(elementId, message, type);
    }

    // 其他导出相关方法...
}