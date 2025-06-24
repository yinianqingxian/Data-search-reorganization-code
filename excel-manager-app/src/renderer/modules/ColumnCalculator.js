export class ColumnCalculator {
    constructor(excelManager) {
        this.excelManager = excelManager;
        this.calculatedColumns = new Map(); // 存储计算列的定义
        this.operationTypes = {
            'add': { label: '加法 (+)', symbol: '+', operation: (a, b) => a + b },
            'subtract': { label: '减法 (-)', symbol: '-', operation: (a, b) => a - b },
            'multiply': { label: '乘法 (×)', symbol: '×', operation: (a, b) => a * b },
            'divide': { label: '除法 (÷)', symbol: '÷', operation: (a, b) => b !== 0 ? a / b : '除零错误' },
            'concat': { label: '连接文本', symbol: '+', operation: (a, b) => `${a}${b}` },
            'percentage': { label: '百分比 (A/B×100)', symbol: '%', operation: (a, b) => b !== 0 ? (a / b * 100).toFixed(2) + '%' : '除零错误' }
        };
    }

    // 获取可用于计算的列（数值列和文本列）
    getAvailableColumns() {
        const numericColumns = [];
        const textColumns = [];
        const allColumns = [...this.excelManager.availableColumns];

        // 添加已计算的列
        this.calculatedColumns.forEach((definition, columnName) => {
            allColumns.push(columnName);
        });

        allColumns.forEach(column => {
            if (this.isNumericColumn(column)) {
                numericColumns.push(column);
            } else {
                textColumns.push(column);
            }
        });

        return { numericColumns, textColumns, allColumns };
    }

    // 判断列是否为数值列
    isNumericColumn(columnName) {
        const sampleData = this.excelManager.excelData.slice(0, 10);
        let numericCount = 0;
        
        for (const row of sampleData) {
            const value = row[columnName];
            if (value && !isNaN(parseFloat(value))) {
                numericCount++;
            }
        }
        
        return numericCount > sampleData.length * 0.5; // 超过50%是数值
    }

    // 构建计算器界面
    buildCalculatorUI() {
        const calculatorContainer = document.createElement('div');
        calculatorContainer.id = 'columnCalculator';
        calculatorContainer.className = 'section';
        calculatorContainer.style.display = 'none';

        const { numericColumns, textColumns, allColumns } = this.getAvailableColumns();

        calculatorContainer.innerHTML = `
            <h2>🧮 列计算器</h2>
            <div class="calculator-content">
                <!-- 计算类型选择 -->
                <div class="calc-type-selector" style="margin-bottom: 1rem;">
                    <label style="font-weight: 600; margin-bottom: 0.5rem; display: block;">计算类型：</label>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                            <input type="radio" name="calcType" value="numeric" checked>
                            <span>数值计算</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                            <input type="radio" name="calcType" value="text">
                            <span>文本操作</span>
                        </label>
                    </div>
                </div>

                <!-- 数值计算区域 -->
                <div id="numericCalc" class="calc-section">
                    <div class="calc-row" style="display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">列A：</label>
                            <select id="columnA" class="calc-select">
                                <option value="">选择列</option>
                                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #666;">
                            <span id="operationSymbol">+</span>
                        </div>
                        
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">列B：</label>
                            <select id="columnB" class="calc-select">
                                <option value="">选择列</option>
                                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #666;">=</div>
                        
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">新列名：</label>
                            <input type="text" id="newColumnName" class="calc-input" placeholder="输入新列名">
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="font-weight: 500; margin-bottom: 0.5rem; display: block;">运算类型：</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">
                            ${Object.entries(this.operationTypes).filter(([key]) => key !== 'concat').map(([key, op]) => `
                                <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem; transition: all 0.2s;">
                                    <input type="radio" name="operation" value="${key}" ${key === 'add' ? 'checked' : ''}>
                                    <span>${op.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 文本操作区域 -->
                <div id="textCalc" class="calc-section" style="display: none;">
                    <div class="calc-row" style="display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">列A：</label>
                            <select id="textColumnA" class="calc-select">
                                <option value="">选择列</option>
                                ${allColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #666;">+</div>
                        
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">列B：</label>
                            <select id="textColumnB" class="calc-select">
                                <option value="">选择列</option>
                                ${allColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #666;">=</div>
                        
                        <div>
                            <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">新列名：</label>
                            <input type="text" id="textNewColumnName" class="calc-input" placeholder="输入新列名">
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="font-weight: 500; margin-bottom: 0.25rem; display: block;">连接符（可选）：</label>
                        <input type="text" id="textSeparator" class="calc-input" placeholder="如：-, _, 空格等" style="max-width: 200px;">
                        <div class="help-text">留空则直接连接，输入符号则在两列之间插入</div>
                    </div>
                </div>

                <!-- 预览区域 -->
                <div id="calcPreview" style="display: none; margin: 1rem 0; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem; border: 1px solid #e9ecef;">
                    <h4 style="margin-bottom: 0.5rem;">📋 计算预览（前5行）</h4>
                    <div id="previewTable"></div>
                </div>

                <!-- 操作按钮 -->
                <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                    <button id="previewCalcBtn" class="button secondary">👁️ 预览计算</button>
                    <button id="executeCalcBtn" class="button" disabled>✅ 执行计算</button>
                    <button id="clearCalcBtn" class="button secondary">🗑️ 清除</button>
                </div>

                <!-- 已有计算列管理 -->
                <div id="existingCalcColumns" style="margin-top: 1.5rem; display: none;">
                    <h4>📊 已创建的计算列</h4>
                    <div id="calcColumnsList"></div>
                </div>
            </div>
        `;

        return calculatorContainer;
    }

    // 初始化计算器
    initCalculator() {
        const calculatorUI = this.buildCalculatorUI();
        
        // 插入到筛选组件后面
        const filterSection = document.querySelector('.section:nth-child(2)');
        if (filterSection && filterSection.nextSibling) {
            filterSection.parentNode.insertBefore(calculatorUI, filterSection.nextSibling);
        } else {
            document.querySelector('.content').appendChild(calculatorUI);
        }

        this.bindCalculatorEvents();
    }

    // 绑定计算器事件
    bindCalculatorEvents() {
        // 计算类型切换
        document.querySelectorAll('input[name="calcType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const numericCalc = document.getElementById('numericCalc');
                const textCalc = document.getElementById('textCalc');
                
                if (e.target.value === 'numeric') {
                    numericCalc.style.display = 'block';
                    textCalc.style.display = 'none';
                } else {
                    numericCalc.style.display = 'none';
                    textCalc.style.display = 'block';
                }
                this.clearPreview();
            });
        });

        // 运算类型切换
        document.querySelectorAll('input[name="operation"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const symbol = this.operationTypes[e.target.value].symbol;
                document.getElementById('operationSymbol').textContent = symbol;
                this.clearPreview();
            });
        });

        // 输入变化时清除预览
        ['columnA', 'columnB', 'newColumnName', 'textColumnA', 'textColumnB', 'textNewColumnName', 'textSeparator'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.clearPreview());
            }
        });

        // 预览按钮
        document.getElementById('previewCalcBtn').addEventListener('click', () => this.previewCalculation());
        
        // 执行按钮
        document.getElementById('executeCalcBtn').addEventListener('click', () => this.executeCalculation());
        
        // 清除按钮
        document.getElementById('clearCalcBtn').addEventListener('click', () => this.clearCalculator());
    }

    // 预览计算结果
    previewCalculation() {
        const calcType = document.querySelector('input[name="calcType"]:checked').value;
        
        if (calcType === 'numeric') {
            this.previewNumericCalculation();
        } else {
            this.previewTextCalculation();
        }
    }

    // 预览数值计算
    previewNumericCalculation() {
        const columnA = document.getElementById('columnA').value;
        const columnB = document.getElementById('columnB').value;
        const newColumnName = document.getElementById('newColumnName').value.trim();
        const operation = document.querySelector('input[name="operation"]:checked').value;

        if (!columnA || !columnB || !newColumnName) {
            alert('请选择两个列并输入新列名');
            return;
        }

        if (this.excelManager.availableColumns.includes(newColumnName) || this.calculatedColumns.has(newColumnName)) {
            alert('列名已存在，请使用其他名称');
            return;
        }

        const preview = this.generateNumericPreview(columnA, columnB, newColumnName, operation);
        this.showPreview(preview);
    }

    // 预览文本操作
    previewTextCalculation() {
        const columnA = document.getElementById('textColumnA').value;
        const columnB = document.getElementById('textColumnB').value;
        const newColumnName = document.getElementById('textNewColumnName').value.trim();
        const separator = document.getElementById('textSeparator').value;

        if (!columnA || !columnB || !newColumnName) {
            alert('请选择两个列并输入新列名');
            return;
        }

        if (this.excelManager.availableColumns.includes(newColumnName) || this.calculatedColumns.has(newColumnName)) {
            alert('列名已存在，请使用其他名称');
            return;
        }

        const preview = this.generateTextPreview(columnA, columnB, newColumnName, separator);
        this.showPreview(preview);
    }

    // 生成数值计算预览
    generateNumericPreview(columnA, columnB, newColumnName, operation) {
        const operationFunc = this.operationTypes[operation].operation;
        const previewData = this.excelManager.excelData.slice(0, 5);
        
        return previewData.map(row => {
            const valueA = this.getNumericValue(row[columnA]);
            const valueB = this.getNumericValue(row[columnB]);
            const result = operationFunc(valueA, valueB);
            
            return {
                [columnA]: row[columnA],
                [columnB]: row[columnB],
                [newColumnName]: result
            };
        });
    }

    // 生成文本操作预览
    generateTextPreview(columnA, columnB, newColumnName, separator = '') {
        const previewData = this.excelManager.excelData.slice(0, 5);
        
        return previewData.map(row => {
            const valueA = (row[columnA] || '').toString();
            const valueB = (row[columnB] || '').toString();
            const result = separator ? `${valueA}${separator}${valueB}` : `${valueA}${valueB}`;
            
            return {
                [columnA]: row[columnA],
                [columnB]: row[columnB],
                [newColumnName]: result
            };
        });
    }

    // 显示预览
    showPreview(previewData) {
        const previewContainer = document.getElementById('calcPreview');
        const previewTable = document.getElementById('previewTable');
        
        if (previewData.length === 0) {
            previewTable.innerHTML = '<p>没有数据可预览</p>';
            previewContainer.style.display = 'block';
            return;
        }

        const columns = Object.keys(previewData[0]);
        let html = '<table class="table" style="font-size: 0.875rem;"><thead><tr>';
        
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        previewData.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                html += `<td>${row[col]}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        previewTable.innerHTML = html;
        previewContainer.style.display = 'block';
        
        // 启用执行按钮
        document.getElementById('executeCalcBtn').disabled = false;
    }

    // 执行计算
    executeCalculation() {
        const calcType = document.querySelector('input[name="calcType"]:checked').value;
        
        if (calcType === 'numeric') {
            this.executeNumericCalculation();
        } else {
            this.executeTextCalculation();
        }
    }

    // 执行数值计算
    executeNumericCalculation() {
        const columnA = document.getElementById('columnA').value;
        const columnB = document.getElementById('columnB').value;
        const newColumnName = document.getElementById('newColumnName').value.trim();
        const operation = document.querySelector('input[name="operation"]:checked').value;

        const operationFunc = this.operationTypes[operation].operation;
        
        // 为所有数据添加新列
        this.excelManager.excelData.forEach(row => {
            const valueA = this.getNumericValue(row[columnA]);
            const valueB = this.getNumericValue(row[columnB]);
            row[newColumnName] = operationFunc(valueA, valueB);
        });

        // 如果有筛选数据，也要更新
        if (this.excelManager.filteredData.length > 0) {
            this.excelManager.filteredData.forEach(row => {
                const valueA = this.getNumericValue(row[columnA]);
                const valueB = this.getNumericValue(row[columnB]);
                row[newColumnName] = operationFunc(valueA, valueB);
            });
        }

        // 记录计算列定义
        this.calculatedColumns.set(newColumnName, {
            type: 'numeric',
            columnA,
            columnB,
            operation,
            formula: `${columnA} ${this.operationTypes[operation].symbol} ${columnB}`
        });

        this.completeCalculation(newColumnName);
    }

    // 执行文本操作
    executeTextCalculation() {
        const columnA = document.getElementById('textColumnA').value;
        const columnB = document.getElementById('textColumnB').value;
        const newColumnName = document.getElementById('textNewColumnName').value.trim();
        const separator = document.getElementById('textSeparator').value;

        // 为所有数据添加新列
        this.excelManager.excelData.forEach(row => {
            const valueA = (row[columnA] || '').toString();
            const valueB = (row[columnB] || '').toString();
            row[newColumnName] = separator ? `${valueA}${separator}${valueB}` : `${valueA}${valueB}`;
        });

        // 如果有筛选数据，也要更新
        if (this.excelManager.filteredData.length > 0) {
            this.excelManager.filteredData.forEach(row => {
                const valueA = (row[columnA] || '').toString();
                const valueB = (row[columnB] || '').toString();
                row[newColumnName] = separator ? `${valueA}${separator}${valueB}` : `${valueA}${valueB}`;
            });
        }

        // 记录计算列定义
        this.calculatedColumns.set(newColumnName, {
            type: 'text',
            columnA,
            columnB,
            separator,
            formula: separator ? `${columnA} + "${separator}" + ${columnB}` : `${columnA} + ${columnB}`
        });

        this.completeCalculation(newColumnName);
    }

    // 完成计算后的操作
    completeCalculation(newColumnName) {
        // 更新可用列列表
        this.excelManager.availableColumns.push(newColumnName);
        
        // 重新构建列选择器
        this.excelManager.uiManager.buildMultiColumnSelector(
            this.excelManager.dataProcessor.findRecommendedColumns()
        );
        
        // 更新数据统计
        this.excelManager.uiManager.showDataStats();
        
        // 更新预览
        this.excelManager.uiManager.displayPreview();
        
        // 更新已有计算列列表
        this.updateExistingCalculatedColumns();
        
        // 清除计算器
        this.clearCalculator();
        
        // 显示成功消息
        this.excelManager.showStatus('filterStatus', 
            `🎉 计算列"${newColumnName}"创建成功！\n` +
            `公式：${this.calculatedColumns.get(newColumnName).formula}\n` +
            `已添加到数据表中，可以参与筛选和导出。`, 
            'success'
        );
    }

    // 更新已有计算列列表
    updateExistingCalculatedColumns() {
        const container = document.getElementById('existingCalcColumns');
        const list = document.getElementById('calcColumnsList');
        
        if (this.calculatedColumns.size === 0) {
            container.style.display = 'none';
            return;
        }

        let html = '<div style="display: grid; gap: 0.5rem;">';
        this.calculatedColumns.forEach((definition, columnName) => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8f9fa; border-radius: 0.25rem; border: 1px solid #e9ecef;">
                    <div>
                        <strong>${columnName}</strong>
                        <span style="margin-left: 0.5rem; color: #666; font-size: 0.875rem;">${definition.formula}</span>
                    </div>
                    <button onclick="window.excelManager.columnCalculator.removeCalculatedColumn('${columnName}')" 
                            class="button secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">删除</button>
                </div>
            `;
        });
        html += '</div>';
        
        list.innerHTML = html;
        container.style.display = 'block';
    }

    // 删除计算列
    removeCalculatedColumn(columnName) {
        if (!confirm(`确定要删除计算列"${columnName}"吗？`)) {
            return;
        }

        // 从数据中移除该列
        this.excelManager.excelData.forEach(row => {
            delete row[columnName];
        });

        if (this.excelManager.filteredData.length > 0) {
            this.excelManager.filteredData.forEach(row => {
                delete row[columnName];
            });
        }

        // 从可用列中移除
        this.excelManager.availableColumns = this.excelManager.availableColumns.filter(col => col !== columnName);
        
        // 从选中列中移除
        this.excelManager.selectedColumns = this.excelManager.selectedColumns.filter(col => col !== columnName);
        
        // 删除计算列定义
        this.calculatedColumns.delete(columnName);
        
        // 更新界面
        this.excelManager.uiManager.buildMultiColumnSelector(
            this.excelManager.dataProcessor.findRecommendedColumns()
        );
        this.excelManager.uiManager.displayPreview();
        this.updateExistingCalculatedColumns();
        
        this.excelManager.showStatus('filterStatus', `计算列"${columnName}"已删除`, 'info');
    }

    // 获取数值
    getNumericValue(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    // 清除预览
    clearPreview() {
        document.getElementById('calcPreview').style.display = 'none';
        document.getElementById('executeCalcBtn').disabled = true;
    }

    // 清除计算器
    clearCalculator() {
        document.getElementById('columnA').value = '';
        document.getElementById('columnB').value = '';
        document.getElementById('newColumnName').value = '';
        document.getElementById('textColumnA').value = '';
        document.getElementById('textColumnB').value = '';
        document.getElementById('textNewColumnName').value = '';
        document.getElementById('textSeparator').value = '';
        
        // 重置为加法
        document.querySelector('input[name="operation"][value="add"]').checked = true;
        document.getElementById('operationSymbol').textContent = '+';
        
        this.clearPreview();
    }

    // 显示/隐藏计算器
    toggleCalculator() {
        const calculator = document.getElementById('columnCalculator');
        if (calculator) {
            const isVisible = calculator.style.display !== 'none';
            calculator.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.updateCalculatorOptions();
            }
        }
    }

    // 更新计算器选项（当数据变化时）
    updateCalculatorOptions() {
        const { numericColumns, textColumns, allColumns } = this.getAvailableColumns();
        
        // 更新数值列选项
        const updateSelect = (selectId, columns) => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">选择列</option>' + 
                    columns.map(col => `<option value="${col}">${col}</option>`).join('');
                if (columns.includes(currentValue)) {
                    select.value = currentValue;
                }
            }
        };

        updateSelect('columnA', numericColumns);
        updateSelect('columnB', numericColumns);
        updateSelect('textColumnA', allColumns);
        updateSelect('textColumnB', allColumns);
    }
}