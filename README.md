# 📊 Excel 数据管理器

一个现代化的桌面应用程序，专为Excel/CSV数据的智能筛选、管理和导出而设计。支持多种文件格式，提供直观的用户界面和强大的数据处理功能。

## ✨ 主要功能

### 📁 文件处理
- **多格式支持**：支持 `.xlsx`、`.xls`、`.csv` 格式
- **智能编码检测**：自动检测CSV文件编码（UTF-8、GBK、GB2312、GB18030）
- **拖拽上传**：支持文件拖拽到应用窗口直接上传
- **文件信息展示**：显示文件大小、修改时间、类型等详细信息

### 🔍 智能筛选
- **多列选择**：支持选择多个列进行筛选
- **智能列推荐**：自动识别城市、日期、数量等常用列类型
- **多种匹配模式**：
  - 精确匹配（完全相等）
  - 模糊匹配（包含关键词）
  - 正则表达式匹配
- **多项搜索**：支持逗号分隔的多个搜索词
- **逻辑组合**：AND（同时包含）/ OR（包含任一）逻辑

### 📊 数据预览
- **实时统计**：显示总行数、总列数、筛选列数
- **数据预览表格**：支持大数据量的分页显示
- **列高亮显示**：直观显示选中的筛选列和导出列
- **筛选结果统计**：实时显示筛选后的数据量

### 💾 数据导出
- **CSV导出**：标准CSV格式，支持中文编码
- **Excel兼容导出**：生成Excel可直接打开的CSV文件
- **选择性导出**：仅导出选中的列，减少文件大小
- **自定义文件名**：支持自定义导出文件名

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd excel-manager-app
```

2. **安装依赖**
```bash
npm install
```

3. **启动应用**
```bash
# 开发模式
npm start

# 或者直接运行Electron
npx electron src/main/main.js
```

### 浏览器版本
如果您想在浏览器中使用，可以直接打开 `browser.html` 文件：
```bash
# 使用本地服务器（推荐）
npx serve .
# 然后访问 http://localhost:3000/browser.html
```

## 📖 使用指南

### 第一步：上传文件
1. 点击"选择文件"按钮或直接拖拽文件到窗口
2. 支持的格式：`.xlsx`、`.xls`、`.csv`
3. 应用会自动解析文件并显示数据统计

### 第二步：选择筛选列
1. 系统会自动推荐常用的筛选列（如城市、地区等）
2. 您也可以手动选择任意列进行筛选
3. 支持多列同时选择

### 第三步：设置筛选条件
1. 选择匹配模式（精确/模糊/正则）
2. 输入搜索内容（支持逗号分隔多个关键词）
3. 点击"开始筛选"查看结果

### 第四步：导出数据
1. 预览筛选结果
2. 输入导出文件名
3. 选择导出格式（CSV 或 Excel兼容）
4. 点击导出按钮下载文件

## 🛠️ 项目结构

```
excel-manager-app/
├── src/
│   ├── main/                    # Electron主进程
│   │   ├── main.js             # 应用入口
│   │   └── preload.js          # 预加载脚本
│   └── renderer/               # 渲染进程（前端）
│       ├── index.html          # 主界面
│       ├── app.js              # 主应用逻辑
│       ├── modules/            # 功能模块
│       │   ├── FileHandler.js  # 文件处理
│       │   ├── DataProcessor.js # 数据处理
│       │   ├── UIManager.js    # 界面管理
│       │   └── DataExporter.js # 数据导出
│       └── styles/
│           └── main.css        # 现代化样式
├── build/
│   └── icon.ico               # 应用图标
├── browser.html               # 浏览器版本
├── package.json              # 项目配置
└── README.md                 # 项目文档
```

## 💡 特色亮点

### 🎨 现代化UI设计
- 采用现代CSS变量系统，支持深色模式
- 流畅的动画效果和微交互
- 响应式设计，适配各种屏幕尺寸
- 直观的卡片式布局

### 🧠 智能化功能
- 自动识别常用列类型（城市、日期、数量等）
- 智能编码检测，解决中文乱码问题
- 推荐筛选列，提升用户体验

### ⚡ 高性能处理
- 支持大文件处理（最大50MB）
- 增量渲染，避免界面卡顿
- 内存优化，提升处理速度

### 🔒 安全可靠
- 纯本地处理，数据不上传
- HTML转义，防止XSS攻击
- 错误处理和用户提示

## 🔧 开发说明

### 技术栈
- **框架**：Electron
- **前端**：原生JavaScript + HTML5 + CSS3
- **数据处理**：SheetJS (xlsx)
- **构建工具**：npm

### 开发模式
```bash
# 启动开发模式（自动打开开发者工具）
NODE_ENV=development npm start

# 或者
npm start -- --dev
```

### 打包发布
```bash
# 安装electron-builder
npm install -g electron-builder

# 打包应用
electron-builder
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🐛 问题反馈

如果您遇到任何问题或有功能建议，请：

1. 查看 [Issues](../../issues) 中是否已有相关问题
2. 如果没有，请创建新的Issue并详细描述问题
3. 提供错误信息、截图等有助于问题解决的信息

## 📞 联系方式

- 项目仓库：[GitHub链接]
- 邮箱：[您的邮箱]

---

⭐ 如果这个项目对您有帮助，请给个Star支持一下！