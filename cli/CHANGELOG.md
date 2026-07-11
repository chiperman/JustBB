# Changelog

All notable changes to `justmemo-cli` will be documented in this file.

## 0.1.1 (2026-07-11)

### Fixed

- 修复全局安装后 `justmemo` 命令入口未执行的问题。

## 0.1.0 (2026-07-11)

### Added

- 可以通过浏览器授权登录 JustMemo，不需要在终端输入密码。
- 可以在终端查看当前账号、搜索 Memo 和查看公开内容。
- 可以临时输入口令查看私密 Memo，口令不会保存到设备。
- 可以发布公开或私密 Memo，并设置访问口令和置顶状态。
- 支持纯文本和 JSON 输出，方便日常使用和脚本调用。

### Changed

- 登录成功后会自动记住当前设备，退出登录后即可清除本机登录状态。
- 搜索、查看和发布命令的提示信息更加清晰。
