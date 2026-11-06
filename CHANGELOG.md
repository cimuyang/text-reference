# Changelog

## 0.12.0

- 上下文预览传入完整起止位置，在原生浮窗中标记可可靠映射的引文文字，支持段中起止、跨标题、段落和换行。
- 重复文字、复杂格式或环境不支持精确标记时显示上下文说明；核心预览开启时不再竞争创建备用浮窗。
- 点击、Enter 和悬停使用最新关联；更新引文后恢复全局显示长度。合并并发读取和文档监听，按来源版本复用校验。
- Precise range highlighting where reliably mapped, fresh navigation bindings, and less duplicate work. 101 automated checks pass; real Obsidian, theme and mobile validation remains outstanding.

## 0.11.0

- 修复正文写入后读取旧编辑器缓存误判失败，导致关联停用；分别处理编辑器和文件更新。
- 识别延迟的部分替换通知，成功更新后关闭核对窗口；错误按来源、目标、同步和写入区分。
- 已标记但仍保有记录的有效引用可以核对后恢复；长删除使用更克制的标记。
- Authoritative editor/file updates and delayed mirror handling. 86 automated checks, including real CodeMirror button-to-update flows. Obsidian UI validation is incomplete after user stop.


## 0.10.0

- 修复更新后阅读链接未重新绑定，导致长度设置和右键菜单同时失效。
- 双栏核对按内容对齐，删除段落保留对应空位；窄窗口自动上下排列。
- 新增渲染／提交先后顺序、连续更新撤销、重复绑定、身份重载及对比完整性检查。
- Restored post-update preview and menus; aligned responsive comparison. 82 automated checks; real-app validation remains outstanding.


## 0.9.0

- 打开来源成功后关闭弹窗并交接焦点，复用已打开的来源；保留文字选区与原生右键。
- 修复更新途中删除记录复活；数据保存失败保留撤销和重试，按实际目标内容确认改名绑定。
- 保存带来源版本校验的最新定位；分块处理外部修改与长文差异，增加多行边界恢复，拒绝单侧同文误定位。
- Navigation, selection, update persistence and verified locator improvements. 77 automated checks pass; real-app validation remains outstanding.


## 0.8.0

- 核对窗口保留原文段落，新增背景与删除线标记；逐处对比，支持中文和字符簇。
- 源码编辑状态增加引用右键入口，按实际位置判断，不改变选区。
- 改进文件首尾和整篇多行引用恢复，映射换行规范化后的原始位置。
- 自动追踪显示原文已变化／待核对；仅换行格式变化不提示正文改写。
- Paragraph-preserving diff, source-mode menus and conservative multi-line recovery. 67 automated checks; real-app validation remains outstanding.


## 0.7.0

- 引用右键只保留核对原文、显示／收起全文；移除来源右键修复流程及隐形目标状态。
- 用外侧上下文恢复改写后的范围，验证剩余同文的出处；不确定时保留摘录。
- 后台变化只显示待核对；核对窗口展示差异，确认期间内容变化在窗口内提示。
- 设置按来源、样式、长度、示例、说明、快捷键、追踪、恢复排列。
- Simplified menus and notifications, contextual passage recovery and inline comparison. 63 automated checks pass; real Obsidian validation remains outstanding.


## 0.6.0

- 默认开启“追踪原文变化”：编辑暂停后提示核对，引用旁显示“待核对”；确认后只更新所选引用，可撤销。
- 按编辑范围追踪增删改；无法可靠确定范围时要求重新选择。关闭追踪会取消检查，不自动覆盖摘录。
- 快捷键与命令列表仅保留“复制引用”和“引用到”；更新与位置修复统一到引用右键菜单。
- 设置按显示、预览、追踪、使用说明排序；恢复默认显示保留快捷键和追踪偏好。
- Added source tracking and actionable review, conservative passage mapping, guarded updates and undo. Simplified commands and settings.
- 56 automated checks pass, including real CodeMirror state/DOM tests. Real Obsidian and mobile validation remains outstanding.

## 0.5.0

- 复制引用默认 Mod+Shift+C，可在原生快捷键设置自定义，插件设置展示有效绑定及入口。
- 增加默认开启的原文变化提示，按来源文件延迟检查，只在右键菜单提示，不自动改写引文。
- 更新前复核记录，清除修复标记，区分程序更新与用户删除；提供本次更新的撤销入口。
- 新增同步编辑器通知、更新撤销、确认过期保护和快捷键注册回归测试。


## 0.4.1

- 删除引用后直接从持久化关联数组移除，对应撤销记录只留当前会话内存。
- 移除检查、清理、恢复清理设置及观察期、维护备份、持久删除标记。
- 保留其他引用、来源改动与部分编辑的可修复关联；未加入历史数据清理。
- 38 项自动检查通过；真实 Obsidian 和多端并发仍待验收。


## 0.4.0

- 跟踪目标编辑中的引用失活、恢复与重新粘贴，防止旧记录和新记录争用同一位置。
- 新增检查、24小时观察后的手动清理、执行前复查和单份恢复备份，不修改笔记正文。
- 分离临时显示刷新与持久保存；加入数据版本、外部记录合并及删除标记，减少旧记录复活。
- 新增撤销重做、重复粘贴、清理复查、备份恢复和外部删除回归检查。


## 0.3.1

- Ctrl/Cmd 悬停支持先按键后移入、先悬停后按键，两条路径统一去重和取消。
- 优先使用核心页面预览；核心未创建浮窗时，使用原生 HoverPopover 容器与 MarkdownRenderer 展示原句上下文，避免静默无响应。
- 保持原生链接、来源跟随引文、30 字默认值；新增恢复默认并立即应用已有引用。
- 设置示例改为固定的插件介绍及使用指南，不包含用户笔记内容。
- 32 项自动检查通过；完整 Obsidian 环境与不同版本仍待实机验收。


## 0.3.0

- 移除全文 title 提示，Ctrl/Cmd 悬停仅请求一层原生页面预览，定位到原句上下文。
- 统一点击与拖选手势；拖动后不跳转，复制返回可见选中文字。
- 显示长度、来源位置与样式统一应用于已有引用，实时刷新阅读及编辑视图；全文查看作为临时展开。
- 设置页增加实时示例和中英简短使用说明。
- 29 项自动检查通过，覆盖原生预览事件、局部拖选复制及全局设置刷新；真实 Obsidian、主题与触屏仍待验收。


## 0.2.1

- 修复插入正文后关联数据尚未登记、编辑器预览未刷新造成的显示延迟；复制粘贴与引用到共用显式刷新机制。
- 使用高优先级编辑器状态装饰，避免整条预览被低优先级隐藏装饰吞掉；选区进入时恢复源码，离开后恢复预览。
- 控件通过稳定内容比较复用 DOM，并补齐链接属性、键盘操作和分行信息。
- 将 Markdown 可读文字与原始定位文本分开，原文加粗等语法不再作为引文正文显示。兼容旧版显示文字的阅读视图识别。
- 新增真实 CodeMirror + DOM 回归测试，验证隐藏装饰竞争、首次粘贴、选区切换和 DOM 复用；共 28 项检查通过。
- 尚未完成真实 Obsidian、移动端和第三方主题验收。

## 0.2.0

引文与来源组成原生行内链接；定位数据外置；中英界面、复制引用、来源布局和旧版引用迁移。
