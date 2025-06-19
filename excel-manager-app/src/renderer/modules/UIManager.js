export class UIManager {
    constructor(excelManager) {
        this.excelManager = excelManager;
    }

    // 添加属性访问方法
    get excelData() {
        return this.excelManager.excelData;
    }

    get filteredData() {
        return this.excelManager.filteredData;
    }

    get selectedColumns() {
        return this.excelManager.selectedColumns;
    }

    get availableColumns() {
        return this.excelManager.availableColumns;
    }

    buildMultiColumnSelector(recommendedColumns) {
        const columnSelector = document.getElementById('columnSelector');
        if (!columnSelector) {
            console.error('列选择器容器未找到');
            return;
        }

        // 清空现有内容
        columnSelector.innerHTML = '';

        if (this.availableColumns.length === 0) {
            columnSelector.style.display = 'none';
            return;
        }

        // 构建选择器HTML - 修复这里
        const selectorContainer = document.createElement('div');
        
        // 标题
        const title = document.createElement('h3');
        title.innerHTML = `🎯 选择要筛选的列 <span id="selectedCount" style="color: #4CAF50; font-weight: bold;">${this.selectedColumns.length}</span> / ${this.availableColumns.length}`;
        selectorContainer.appendChild(title);

        // 推荐列部分
        if (recommendedColumns.length > 0) {
            const recommendedSection = document.createElement('div');
            recommendedSection.className = 'column-section recommended-section';
            
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'category-label';
            categoryLabel.textContent = '🌟 推荐列（智能识别）';
            recommendedSection.appendChild(categoryLabel);
            
            const controlButtons = document.createElement('div');
            controlButtons.className = 'control-buttons';
            controlButtons.innerHTML = `
                <button class="button" onclick="window.excelManagerInstance.selectRecommendedColumns()">全选推荐</button>
                <span style="color: #666; font-size: 14px;">常用的筛选列</span>
            `;
            recommendedSection.appendChild(controlButtons);
            
            const columnsGrid = document.createElement('div');
            columnsGrid.className = 'columns-grid';
            
            recommendedColumns.forEach(({column, category}) => {
                const checkbox = this.createColumnCheckbox(column, category, true);
                columnsGrid.appendChild(checkbox);
            });
            
            recommendedSection.appendChild(columnsGrid);
            selectorContainer.appendChild(recommendedSection);
        }

        // 所有列部分
        const groupedColumns = this.groupColumnsByCategory();
        const allColumnsSection = document.createElement('div');
        allColumnsSection.className = 'column-section all-columns-section';
        
        const allColumnsLabel = document.createElement('div');
        allColumnsLabel.className = 'category-label';
        allColumnsLabel.textContent = '📋 所有列';
        allColumnsSection.appendChild(allColumnsLabel);
        
        const allControlButtons = document.createElement('div');
        allControlButtons.className = 'control-buttons';
        allControlButtons.innerHTML = `
            <button class="button" onclick="window.excelManagerInstance.selectAllColumns()">全选</button>
            <button class="button secondary" onclick="window.excelManagerInstance.clearAllColumns()">清空</button>
            <span style="color: #666; font-size: 14px;">选择用于筛选和导出的列</span>
        `;
        allColumnsSection.appendChild(allControlButtons);

        Object.entries(groupedColumns).forEach(([categoryName, columns]) => {
            if (columns.length > 0) {
                const categoryGroup = document.createElement('div');
                categoryGroup.className = 'category-group';
                
                const categoryLabel = document.createElement('div');
                categoryLabel.className = 'category-label';
                categoryLabel.textContent = categoryName;
                categoryGroup.appendChild(categoryLabel);
                
                const columnsGrid = document.createElement('div');
                columnsGrid.className = 'columns-grid';
                
                columns.forEach(column => {
                    const category = this.getCategoryByColumn(column);
                    const isRecommended = recommendedColumns.some(rec => rec.column === column);
                    const checkbox = this.createColumnCheckbox(column, category, isRecommended);
                    columnsGrid.appendChild(checkbox);
                });
                
                categoryGroup.appendChild(columnsGrid);
                allColumnsSection.appendChild(categoryGroup);
            }
        });

        selectorContainer.appendChild(allColumnsSection);
        columnSelector.appendChild(selectorContainer);
        columnSelector.style.display = 'block';

        // 重新绑定事件监听器
        this.bindColumnCheckboxEvents();
    }

    // 绑定复选框事件
    bindColumnCheckboxEvents() {
        this.availableColumns.forEach(column => {
            const checkbox = document.getElementById(`col_${column}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        if (!this.selectedColumns.includes(column)) {
                            this.excelManager.selectedColumns.push(column);
                        }
                    } else {
                        this.excelManager.selectedColumns = this.excelManager.selectedColumns.filter(col => col !== column);
                    }
                    this.updateSelectedCount();
                    this.updateUI();
                });
            }
        });
    }

    displayPreview(data) {
        const results = document.getElementById('results');
        const dataPreview = document.getElementById('dataPreview');
        
        if (!results || !dataPreview) {
            console.error('预览容器元素未找到');
            return;
        }
        
        if (!data || data.length === 0) {
            results.style.display = 'none';
            return;
        }

        const validData = data.filter(row => row && typeof row === 'object');
        if (validData.length === 0) {
            results.style.display = 'none';
            return;
        }

        const headers = Object.keys(validData[0]);
        if (headers.length === 0) {
            console.error('数据中没有找到列标题');
            results.style.display = 'none';
            return;
        }

        let tableHTML = '<div class="table-container"><table class="table"><thead><tr>';
        
        // 标题行 - 高亮选中的列，并标识将要导出列
        headers.forEach(header => {
            const isSelectedColumn = this.selectedColumns.includes(header);
            const escapedHeader = this.escapeHTML(header);
            
            let style = '';
            let icon = '';
            let title = escapedHeader;
            
            if (isSelectedColumn) {
                style = 'background-color: #FF9800; color: white;';
                icon = ' 🎯📤'; // 筛选+导出图标
                title = `${escapedHeader} (筛选列 - 将被导出)`;
            } else {
                style = 'background-color: #ccc; color: #666;';
                title = `${escapedHeader} (不会被导出)`;
            }
            
            tableHTML += `<th style="${style}" title="${title}">${escapedHeader}${icon}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // 数据行 - 高亮选中的列
        validData.forEach((row, index) => {
            tableHTML += `<tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">`;
            headers.forEach(header => {
                const cellValue = row[header] || '';
                const escapedValue = this.escapeHTML(cellValue.toString());
                const isSelectedColumn = this.selectedColumns.includes(header);
                
                let style = '';
                if (isSelectedColumn) {
                    style = 'background-color: #fff3e0; font-weight: bold; border-left: 3px solid #FF9800;';
                } else {
                    style = 'background-color: #f5f5f5; color: #999;';
                }
                
                const displayValue = escapedValue.length > 50 ? 
                    escapedValue.substring(0, 47) + '...' : escapedValue;
                
                tableHTML += `<td style="${style}" title="${escapedValue}">${displayValue}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table></div>';
        
        // 添加导出说明信息
        const totalCount = this.filteredData.length || this.excelData.length;
        const exportInfo = this.selectedColumns.length > 0 
            ? `<br>📤 导出时将只包含 ${this.selectedColumns.length} 个选中列：${this.selectedColumns.join('、')}`
            : '<br>⚠️ 请选择要导出的列';
    
        if (validData.length < totalCount) {
            tableHTML += `<div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px; color: #1976d2;">
                📋 显示前 ${validData.length} 行数据，共 ${totalCount} 行
                ${this.filteredData.length > 0 ? `（已筛选出 ${this.filteredData.length} 行）` : ''}
                ${exportInfo}
            </div>`;
        } else {
            tableHTML += `<div style="margin-top: 15px; padding: 10px; background: #e8f5e8; border-radius: 5px; color: #2e7d32;">
                📋 显示全部 ${validData.length} 行数据
                ${this.filteredData.length > 0 ? '（筛选结果）' : ''}
                ${exportInfo}
            </div>`;
        }
        
        try {
            dataPreview.innerHTML = tableHTML;
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            console.error('渲染预览时出错:', error);
            dataPreview.innerHTML = '<div style="color: red; padding: 20px;">数据预览渲染失败，请检查数据格式。</div>';
            results.style.display = 'block';
        }
    }

    // 修改updateUI方法，添加导出提示
    updateUI() {
        const hasData = this.excelData.length > 0;
        const hasFilteredData = this.filteredData.length > 0;
        const hasSelectedColumns = this.selectedColumns.length > 0;
        
        // 更新按钮状态
        const filterBtn = document.getElementById('filterBtn');
        const clearFilterBtn = document.getElementById('clearFilterBtn');
        const exportCSVBtn = document.getElementById('exportCSVBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        
        if (filterBtn) {
            filterBtn.disabled = !hasData || !hasSelectedColumns;
            filterBtn.title = !hasSelectedColumns ? '请先选择要筛选的列' : '点击进行精确筛选';
            filterBtn.textContent = '🔍 精确筛选';
        }
        if (clearFilterBtn) {
            clearFilterBtn.disabled = !hasData;
        }
        if (exportCSVBtn) {
            exportCSVBtn.disabled = !hasData || !hasSelectedColumns;
            exportCSVBtn.title = !hasSelectedColumns ? '请先选择要导出的列' : `导出选中的 ${this.selectedColumns.length} 列`;
            exportCSVBtn.textContent = hasSelectedColumns ? `💾 导出选中列 (${this.selectedColumns.length})` : '💾 导出 CSV';
        }
        if (exportExcelBtn) {
            exportExcelBtn.disabled = !hasData || !hasSelectedColumns;
            exportExcelBtn.title = !hasSelectedColumns ? '请先选择要导出的列' : `导出选中的 ${this.selectedColumns.length} 列`;
            exportExcelBtn.textContent = hasSelectedColumns ? `📊 导出选中列 (${this.selectedColumns.length})` : '📊 导出 Excel兼容';
        }
        
        // 更新文件名输入框
        const cityInput = document.getElementById('cityInput');
        const filenameInput = document.getElementById('filenameInput');
        
        if (cityInput && filenameInput) {
            const searchValue = cityInput.value.trim();
            if (searchValue && hasFilteredData) {
                const columnsInfo = hasSelectedColumns ? `_${this.selectedColumns.length}列` : '';
                filenameInput.placeholder = `${searchValue}_筛选数据${columnsInfo}`;
            } else if (hasData) {
                const columnsInfo = hasSelectedColumns ? `_${this.selectedColumns.length}列` : '';
                filenameInput.placeholder = `数据导出${columnsInfo}`;
            } else {
                filenameInput.placeholder = '输入文件名（不含扩展名）';
            }
        }
        
        // 更新筛选输入框状态
        if (cityInput) {
            cityInput.disabled = !hasData || !hasSelectedColumns;
            if (!hasSelectedColumns && hasData) {
                cityInput.placeholder = '请先选择要筛选的列';
            } else if (hasSelectedColumns) {
                cityInput.placeholder = `请输入要精确匹配的值（在所选${this.selectedColumns.length}列中搜索）...`;
            } else {
                cityInput.placeholder = '请输入精确筛选值...';
            }
        }
    }

    // 其他UI相关方法
    createColumnCheckbox(column, category, isRecommended) {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col_${column}`;
        checkbox.value = column;
        
        const label = document.createElement('label');
        label.htmlFor = `col_${column}`;
        
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
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        
        return checkboxContainer;
    }

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

    updateCheckboxStates() {
        this.availableColumns.forEach(column => {
            const checkbox = document.getElementById(`col_${column}`);
            if (checkbox) {
                checkbox.checked = this.selectedColumns.includes(column);
            }
        });
    }

    updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedColumns.length;
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}