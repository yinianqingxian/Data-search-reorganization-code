const { app, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false
        },
        show: false,
        title: 'Excel 数据管理器',
        icon: path.join(__dirname, '../../build/icon.ico')
    });

    // 加载HTML文件
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading HTML from:', htmlPath);
    
    mainWindow.loadFile(htmlPath);
    
    // 当页面加载完成后显示窗口
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('🎉 窗口已显示');
        
        // 开发环境下自动打开开发者工具
        if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 错误处理
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ 页面加载失败:', errorCode, errorDescription);
        
        dialog.showErrorBox('加载失败', `页面加载失败：${errorDescription}`);
    });

    // 页面崩溃处理
    mainWindow.webContents.on('crashed', (event, killed) => {
        console.error('❌ 页面崩溃:', { killed });
        
        dialog.showErrorBox('应用崩溃', '应用页面意外崩溃，请重启应用。');
    });

    // 监听控制台消息
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[渲染进程] ${message}`);
    });

    // 创建菜单
    createMenu();

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('页面加载完成，检查XLSX库...');
        
        // 注入XLSX库检测代码
        mainWindow.webContents.executeJavaScript(`
            (function() {
                if (typeof XLSX === 'undefined') {
                    console.log('XLSX库未从CDN加载，尝试本地注入...');
                    return false;
                } else {
                    console.log('XLSX库已可用，版本:', XLSX.version);
                    return true;
                }
            })();
        `).then(xlsxAvailable => {
            if (!xlsxAvailable) {
                // 尝试从本地node_modules注入
                const xlsxPath = path.join(__dirname, '../../node_modules/xlsx/dist/xlsx.full.min.js');
                if (fs.existsSync(xlsxPath)) {
                    console.log('从本地注入XLSX库...');
                    const xlsxCode = fs.readFileSync(xlsxPath, 'utf8');
                    mainWindow.webContents.executeJavaScript(xlsxCode)
                        .then(() => {
                            console.log('✅ XLSX库本地注入成功');
                        })
                        .catch(error => {
                            console.error('❌ XLSX库本地注入失败:', error);
                        });
                } else {
                    console.warn('⚠️ 本地XLSX库文件不存在:', xlsxPath);
                }
            }
        }).catch(error => {
            console.error('XLSX库检测失败:', error);
        });
    });
}

function createMenu() {
    const template = [
        {
            label: '文件',
            submenu: [
                {
                    label: '打开文件',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        // 触发文件选择
                        mainWindow.webContents.executeJavaScript(`
                            document.getElementById('fileInput').click();
                        `);
                    }
                },
                { type: 'separator' },
                {
                    label: '退出',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
            ]
        },
        {
            label: '视图',
            submenu: [
                { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
                { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: '关于 Excel 数据管理器',
                            message: 'Excel 数据管理器',
                            detail: 'Version 1.0.0\n\n一个简单易用的Excel数据筛选和导出工具\n\n支持功能：\n• CSV/Excel文件读取\n• 按城市筛选数据\n• 数据导出\n• 拖拽上传'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
    console.log('🚀 Electron app is ready');
    createWindow();

    // macOS应用激活处理
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用退出前的清理
app.on('before-quit', () => {
    console.log('🛑 应用即将退出');
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    
    dialog.showErrorBox('应用错误', `发生了未预期的错误：\n${error.message}`);
});

console.log('🎯 Main process started');