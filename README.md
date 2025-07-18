# 3D星空模拟器

一个交互式的3D星空可视化项目，使用纯JavaScript、HTML5和CSS实现。该项目提供了沉浸式的星空体验，支持鼠标和触摸控制，以及多种自定义选项。

## 功能特点

- **3D星空渲染**：实时生成和渲染数千颗随机分布的星星
- **交互控制**：通过鼠标或触摸操作旋转视角
- **性能自适应**：自动监控和优化性能，确保在各种设备上流畅运行
- **多种视觉效果**：
  - 多种星星颜色方案（纯白、蓝白、暖色、冷色、彩虹、星云）
  - 星星拖尾效果
  - 星星光晕
- **可配置参数**：
  - 星星数量（100-5000）
  - 移动速度
  - 视觉效果开关
- **响应式设计**：适应桌面和移动设备
- **设备优化**：自动检测移动设备并应用优化设置

## 技术实现

- 纯原生JavaScript（无依赖）
- HTML5 Canvas用于渲染
- 自定义相机系统进行3D投影
- 性能监控和自适应优化
- 完整的测试套件（单元测试和集成测试）

## 安装与运行

### 本地运行

1. 克隆仓库到本地
```bash
git clone <仓库URL>
cd Kiro游戏
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 在浏览器中访问 `http://localhost:3000`

### 生产部署

1. 构建项目
```bash
npm run build
```

2. 部署`dist`目录中的文件到您的网络服务器

## 使用说明

- **视角旋转**：使用鼠标拖动或触摸屏幕拖动
- **调整参数**：使用右侧控制面板调整星星数量、速度和视觉效果
- **选择颜色方案**：从下拉菜单中选择不同的星星颜色
- **开关效果**：使用复选框启用或禁用星星拖尾等效果

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 性能说明

项目包含自动性能优化系统，在低性能设备上会：
1. 减少星星数量
2. 禁用某些视觉效果
3. 跳过部分渲染帧
4. 在性能恢复时逐渐恢复效果

## 开发

### 项目结构

```
Kiro游戏/
  - index.html          # 主页面
  - styles.css          # 样式
  - js/
    - app.js            # 应用入口
    - camera.js         # 3D相机系统
    - config-panel.js   # 配置面板控制
    - inputhandler.js   # 鼠标/触摸输入处理
    - performance-monitor.js  # 性能监控
    - renderer.js       # 渲染器
    - star.js           # 星星对象
    - starfield.js      # 星空管理
  - test/               # 测试文件
```

### 运行测试
##最简单的方法，点开html文件
```bash
npm test
```

## 贡献指南

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT许可证](LICENSE)
