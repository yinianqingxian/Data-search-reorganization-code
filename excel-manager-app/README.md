# Excel Manager App

## 项目简介
Excel Manager App 是一个桌面应用程序，旨在帮助用户轻松管理和操作Excel数据。用户可以上传Excel文件，输入特定条件（如城市名称），并从中筛选出所需的数据。最终，用户可以将筛选后的数据导出到新的Excel文件中，方便下载和使用。

## 功能
- **文件上传**：用户可以选择并上传Excel文件。
- **数据过滤**：根据用户输入的条件（如城市名称）过滤Excel数据。
- **数据导出**：将过滤后的数据导出为新的Excel文件，并提供下载链接。

## 项目结构
```
excel-manager-app
├── src
│   ├── main
│   │   ├── main.ts          # 应用程序的入口点
│   │   └── preload.ts       # 渲染进程和主进程之间的安全通信
│   ├── renderer
│   │   ├── index.html       # 应用程序的主界面
│   │   ├── app.ts           # 渲染进程的主要逻辑
│   │   ├── components
│   │   │   ├── FileUpload.ts # 处理Excel文件的上传
│   │   │   ├── DataFilter.ts  # 根据用户输入过滤数据
│   │   │   └── DataExport.ts  # 导出过滤后的数据
│   │   └── styles
│   │       └── main.css      # 应用程序的样式定义
│   └── shared
│       └── types.ts          # 共享的类型和接口
├── build
│   └── icon.ico              # 应用程序的图标
├── package.json               # npm的配置文件
├── tsconfig.json             # TypeScript的配置文件
├── electron-builder.yml       # Electron打包的配置文件
└── README.md                  # 项目的文档
```

## 安装与使用
1. 克隆项目到本地：
   ```
   git clone <repository-url>
   cd excel-manager-app
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 运行应用程序：
   ```
   npm start
   ```

## 贡献
欢迎任何形式的贡献！请提交问题或拉取请求。

## 许可证
该项目遵循 MIT 许可证。