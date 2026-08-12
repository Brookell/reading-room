# Brooke's Reading Room

这是书架网页的部署、维护与交接文档。当前 `bookshelf/` 目录已经是一个完整的静态网站，可以脱离 3D 主站单独运行，也可以作为独立仓库部署到 GitHub Pages。

项目不需要安装 Node.js，不需要执行构建命令，也没有数据库。书籍内容集中保存在 `books.tsv`，网页会在打开时读取这张表格。

## 目录结构

```text
bookshelf/
├── index.html                 页面结构与按钮
├── styles.css                视觉、书架布局、响应式与动画
├── app.js                    鼠标、键盘、书籍展开和详情交互
├── catalog.js                读取并解析 books.tsv
├── books.tsv                 所有书籍的数据
├── BOOKS.md                  添加书籍的简版说明
├── README.md                 当前这份完整交接文档
├── .nojekyll                 GitHub Pages 静态部署标记
├── assets/
│   ├── covers/               书籍封面
│   └── fonts/                本地字体
└── vendor/
    └── lucide/               本地图标库
```

部署独立书架时，需要上传这个目录里的全部内容，不能只上传 HTML、CSS 和 JavaScript 文件。

## 本地打开

不要直接双击 `index.html`。浏览器通过 `fetch()` 读取 `books.tsv`，使用 `file://` 打开时通常会被浏览器拦截。

### 书架作为独立项目时

在终端进入书架目录：

```bash
cd "/path/to/bookshelf"
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

按 `Control + C` 可以停止服务器。

### 书架仍放在 Brooke 主项目中时

从 `Brooke` 项目根目录启动服务器：

```bash
cd "/path/to/Brooke"
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/bookshelf/
```

## 添加一本书

添加书籍只需要修改封面目录和书单表格，不需要改 JavaScript。

### 1. 添加封面

把封面放进：

```text
assets/covers/
```

建议：

- 使用 `.jpg`、`.png` 或 `.webp`。
- 文件名尽量使用小写英文字母、数字和连字符，例如 `the-second-sex.jpg`。
- 不要使用空格、中文标点或大小写混合的文件名。
- 建议封面宽度为 800 到 1600 像素。
- 单张图片尽量控制在 1.5 MB 以内，以免网页首次加载过慢。

GitHub Pages 区分文件名大小写。`Book.jpg` 和 `book.jpg` 会被视为两个不同文件。

### 2. 在 books.tsv 增加一行

打开 `books.tsv`，复制一行已有书籍，粘贴到文件末尾，再修改内容。

这是一个 Tab 分隔文件：

- 每本书占一行。
- 每一列之间必须是 Tab，不是逗号，也不是多个空格。
- 不要删除第一行列名。
- 不要在简介单元格内部换行。
- 文件顺序就是书架顺序和 `ALL BOOKS` 列表顺序。

示例：

```tsv
第二性	西蒙娜·德·波伏瓦	the-second-sex.jpg	#d8d2c8	#1c1b19	#9b302d	#f4eee8	275	0.92	42	0.67	14	#c8b7b3	第一段书籍介绍。	第二段书籍介绍。
```

### 3. 检查页面

刷新本地书架并确认：

1. 新书书脊出现在预期位置。
2. 鼠标经过时封面能够完整展开。
3. 点击或按空格后能进入详情页。
4. 详情背景、文字颜色与封面协调。
5. `ALL BOOKS` 列表出现新书。
6. 手机宽度下没有文字重叠。

## books.tsv 字段

| 字段 | 用途 | 建议值 |
|---|---|---|
| `书名` | 书脊、列表和详情标题 | 必填 |
| `作者` | 列表和详情作者 | 必填 |
| `封面图片` | `assets/covers/` 中的文件名 | 必填 |
| `主色` | 书籍基础颜色 | `#dededb` |
| `文字色` | 封面与详情文字候选色 | `#211f1c` |
| `书脊颜色` | 书架上的书脊颜色 | 留空时使用主色 |
| `书脊文字色` | 书脊文字颜色 | 留空时使用文字色 |
| `封面宽度` | 封面展开宽度 | `240` 到 `290` |
| `书架高度` | 相对书架高度 | `0.84` 到 `0.96` |
| `书脊宽度` | 合上时的书脊宽度 | `32` 到 `48` |
| `封面比例` | 封面宽除以封面高 | 常见为 `0.67` 或 `2/3` |
| `书架间距` | 与下一本书的间距 | `6` 到 `30` |
| `详情背景色` | 详情页和嵌入式浏览器顶栏颜色 | 留空时使用主色 |
| `简介一` | 第一段介绍 | 可留空 |
| `简介二` | 第二段介绍 | 可留空 |

除了书名、作者和封面图片，其余内容留空时会使用 `catalog.js` 中的默认值。

### 选择颜色

- `详情背景色` 应从封面中选择一个低饱和度的颜色。
- 浅色封面可以使用淡灰粉、灰绿或蓝灰，避免所有书都使用同一种米白色。
- 深色背景可以继续填写深色，代码会在已有文字色中选择对比更清晰的一种。
- 书架嵌入 3D 主站时，详情背景色也会同步到模拟浏览器顶栏。

## 鼠标与键盘操作

- 鼠标经过书脊：预览封面。
- 点击书籍：进入详情页。
- 左右方向键：选择上一本或下一本。
- 空格：打开当前书籍；在详情页再次按空格返回。
- `Escape`：关闭详情、书单或操作帮助。
- 右下角信息按钮：显示操作说明。
- 右下角列表按钮：打开全部书籍目录。

## 独立部署到 GitHub Pages

推荐创建一个新的公开仓库，例如：

```text
brooke-bookshelf
```

预期公开网址会是：

```text
https://brookell.github.io/brooke-bookshelf/
```

### 使用 GitHub Desktop

1. 把当前 `bookshelf/` 文件夹复制到 `Brooke` 主项目之外，例如复制为 `Documents/brooke-bookshelf/`。
2. 打开 GitHub Desktop。
3. 选择 `File > Add Local Repository`，选择刚复制的文件夹。
4. 如果提示它还不是 Git 仓库，选择在该文件夹创建仓库。
5. 在左下角填写第一次提交说明，例如 `Initial bookshelf site`。
6. 点击 `Commit to main`。
7. 点击 `Publish repository`。
8. 仓库名填写 `brooke-bookshelf`，取消 `Keep this code private`，然后发布。

### 开启 GitHub Pages

1. 打开 GitHub 上的新仓库。
2. 进入 `Settings > Pages`。
3. 在 `Build and deployment` 中把 `Source` 设为 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/(root)`。
5. 点击 `Save`。
6. 等待 GitHub 构建完成，通常需要 1 到 5 分钟。
7. 在 Pages 设置页打开 GitHub 给出的公开网址。

仓库根目录必须直接包含 `index.html`。如果网址打开后是 404，首先检查是否不小心多套了一层 `bookshelf/` 文件夹。

### 不创建新仓库的替代方式

当前主项目已经连接到 `Brookell/reading-room`。也可以直接给这个仓库开启 GitHub Pages，书架地址将是：

```text
https://brookell.github.io/reading-room/bookshelf/
```

这种方法最快，但书架与 3D 主站仍属于同一个仓库。需要完全独立维护时，使用单独的 `brooke-bookshelf` 仓库更清楚。

## 以后更新线上书架

推荐流程：

1. 在本地修改封面或 `books.tsv`。
2. 启动本地服务器检查。
3. 在 GitHub Desktop 中查看改动。
4. 填写清楚的提交说明，例如 `Add The Second Sex`。
5. 点击 `Commit to main`。
6. 点击 `Push origin`。
7. 等待 GitHub Pages 自动更新。

网页仍显示旧内容时，先进行强制刷新：

- macOS：`Command + Shift + R`
- Windows：`Control + F5`

## 在新电脑上继续修改

### 推荐：克隆仓库

使用 GitHub Desktop 的 `File > Clone Repository` 下载完整仓库。这样会保留提交历史，以后可以直接提交和推送。

### 临时使用：Download ZIP

在 GitHub 仓库页面选择 `Code > Download ZIP`。解压后仍然可以修改和本地预览，但 ZIP 不包含 Git 提交历史。长期维护建议使用 Clone，而不是反复下载 ZIP。

下载后只需要：

```bash
cd "/path/to/brooke-bookshelf"
python3 -m http.server 4173
```

## 重新嵌入 3D 主站

3D 主站的 `app.js` 顶部包含：

```js
const BOOKSHELF_EMBED_URL = "./bookshelf/?v=...";
```

如果以后希望 3D 主站直接加载独立部署的书架，可以改成：

```js
const BOOKSHELF_EMBED_URL = "https://brookell.github.io/brooke-bookshelf/";
```

当前代码会根据 iframe 的真实来源验证主题色消息，因此使用独立 GitHub Pages 地址后，书籍详情色仍然可以同步到模拟浏览器顶栏。

## 继续增加功能

主要修改位置：

- 新增或调整书籍字段：`books.tsv` 和 `catalog.js`
- 新增交互、搜索、筛选或键盘功能：`app.js`
- 调整书架、详情页、书单和移动端样式：`styles.css`
- 增加按钮或新的页面结构：`index.html`

建议保持“内容与功能分离”：书名、作者、颜色和简介继续放在 `books.tsv`，不要把某一本书的数据直接写进 `app.js`。

增加新字段时，需要同时完成：

1. 在 `books.tsv` 第一行增加列名。
2. 在每一行增加对应单元格。
3. 在 `catalog.js` 的 `BOOK_TABLE_COLUMNS` 中登记字段。
4. 在 `catalog.js` 中把字段放进 book 对象。
5. 在 `app.js` 中显示或使用它。

## 常见问题

### 页面显示“书单加载失败”

- 确认页面通过 `http://` 或 `https://` 打开，不是 `file://`。
- 确认 `books.tsv` 仍在项目根目录。
- 确认所有行的列数相同。
- 确认没有把 Tab 改成逗号。

### 封面不显示

- 确认图片位于 `assets/covers/`。
- 确认 `books.tsv` 中只填写文件名。
- 检查大小写和扩展名是否完全一致。

### GitHub Pages 是 404

- 确认 Pages 已设置为 `main` 和 `/(root)`。
- 确认 `index.html` 位于仓库根目录。
- 查看仓库的 `Actions` 或 `Settings > Pages` 是否仍在构建。

### 页面在手机上布局异常

- 不要删除 `index.html` 中的 viewport meta 标签。
- 检查新增书名是否过长。
- 用浏览器开发者工具测试约 `390 x 844` 的视口。

## 发布前检查

- [ ] 本地服务器可以打开页面
- [ ] 所有封面都能加载
- [ ] 鼠标预览与点击正常
- [ ] 左右方向键与空格正常
- [ ] `ALL BOOKS` 列表完整
- [ ] 桌面和手机布局无重叠
- [ ] GitHub 仓库根目录存在 `index.html`
- [ ] GitHub Pages 已启用
- [ ] 公开网址可以在未登录 GitHub 的浏览器中打开
