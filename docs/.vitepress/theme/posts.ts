// 本文件由 scripts/sync-posts.mjs 自动生成，请勿手改
export interface Post {
  url: string
  slug: string
  title: string
  date: string
  categories: string[]
  categoryColors: string[]
  tags: string[]
  description: string
  author: string
  words: number
  cjk: number
  source: string
  images: number
}

export interface Category {
  name: string
  color: string
  desc: string
  count: number
}

export const posts: Post[] = [
  {
    "url": "/posts/file-include",
    "slug": "file-include",
    "title": "ctf文件包含",
    "date": "2026-10-18",
    "categories": [
      "文件包含",
      "ctf"
    ],
    "categoryColors": [
      "#a16207",
      "#b45309"
    ],
    "tags": [
      "文件包含",
      "CTF"
    ],
    "description": "LFI:本地文件包含漏洞(Local File Inclusion)",
    "author": "Fan-SecLab",
    "words": 3770,
    "cjk": 3255,
    "source": "2026-10-18-file_include",
    "images": 25
  },
  {
    "url": "/posts/waf绕过",
    "slug": "waf绕过",
    "title": "WAF绕过",
    "date": "2026-10-01",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "waf绕过",
      "WAF",
      "文件上传",
      "编码绕过",
      "SQL注入",
      "分块传输",
      "参数污染",
      "渗透测试"
    ],
    "description": "从 WAF 的检查机制讲起，梳理身份认证阶段、数据包解析阶段、触发规则阶段的绕过思路，配合编码/注释/大小写/双写等变形手法与 sqlmap tamper 速查表，并整理文件上传检测绕过的常见变形、WAF 识别指纹与常用检测工具。",
    "author": "Fan-SecLab",
    "words": 3998,
    "cjk": 3475,
    "source": "2026-10-01-waf绕过-排版",
    "images": 9
  },
  {
    "url": "/posts/文件上传",
    "slug": "文件上传",
    "title": "文件上传ctf解题思路",
    "date": "2026-09-16",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "ctf",
      "文件上传",
      "绕过",
      "webshell",
      "渗透测试"
    ],
    "description": "整理文件上传类 CTF 题目中常见的可上传后缀、前端校验/MIME/黑名单/双写等绕过思路，以及 .htaccess、.user.ini、图片码、shtml、盲注等进阶利用手法与实战案例记录。",
    "author": "Fan-SecLab",
    "words": 1739,
    "cjk": 1462,
    "source": "2026-09-16-文件上传-排版",
    "images": 16
  },
  {
    "url": "/posts/php-sql",
    "slug": "php-sql",
    "title": "php弱类型+sql注入ctf解题思路",
    "date": "2026-09-11",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [],
    "description": "浏览器F12检查源代码",
    "author": "Fan-SecLab",
    "words": 7088,
    "cjk": 6364,
    "source": "2026-09-11-php+sql",
    "images": 64
  },
  {
    "url": "/posts/permission-optimized",
    "slug": "permission-optimized",
    "title": "权限问题",
    "date": "2026-08-13",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "权限",
      "旁注",
      "目录越权",
      "跨库查询",
      "CDN",
      "越权"
    ],
    "description": "权限安全笔记：旁站查询与入侵、目录越权、SQL 跨库查询、CDN 识别与绕过、越权漏洞分类与 pikachu 实战演示。",
    "author": "Fan-SecLab",
    "words": 1833,
    "cjk": 1690,
    "source": "2026-07-30-permission-optimized",
    "images": 14
  },
  {
    "url": "/posts/docker",
    "slug": "docker",
    "title": "docker 容器",
    "date": "2026-08-12",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [],
    "description": "搜索镜像(只搜索官方仓库的，官方仓库地址：hub.docker.com)",
    "author": "Fan-SecLab",
    "words": 556,
    "cjk": 501,
    "source": "2026-08-12-docker",
    "images": 1
  },
  {
    "url": "/posts/brute-force",
    "slug": "brute-force",
    "title": "暴力破解",
    "date": "2026-07-28",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "暴力破解",
      "Bruter",
      "Hydra",
      "pkav"
    ],
    "description": "---",
    "author": "Fan-SecLab",
    "words": 2544,
    "cjk": 2221,
    "source": "2026-07-28-Brute Force",
    "images": 11
  },
  {
    "url": "/posts/ssrf",
    "slug": "ssrf",
    "title": "SSRF漏洞详解",
    "date": "2026-07-22",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "SSRF"
    ],
    "description": "---",
    "author": "Fan-SecLab",
    "words": 5181,
    "cjk": 4530,
    "source": "2026-07-22-SSRF",
    "images": 23
  },
  {
    "url": "/posts/反序列化",
    "slug": "反序列化",
    "title": "反序列化漏洞",
    "date": "2026-07-20",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "反序列化漏洞"
    ],
    "description": "---",
    "author": "Fan-SecLab",
    "words": 3276,
    "cjk": 2969,
    "source": "2026-07-20-反序列化",
    "images": 22
  },
  {
    "url": "/posts/rce",
    "slug": "rce",
    "title": "RCE命令执行漏洞",
    "date": "2026-07-18",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "RCE"
    ],
    "description": "命令执行漏洞，英文 remote command/code execute，简称 RCE，包含远程命令执行和远程代码执行。",
    "author": "Fan-SecLab",
    "words": 2214,
    "cjk": 1937,
    "source": "2026-07-18-RCE",
    "images": 38
  },
  {
    "url": "/posts/xxe",
    "slug": "xxe",
    "title": "XXE（XML外部实体注入）从入门到实战",
    "date": "2026-07-17",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "XXE"
    ],
    "description": "XXE：XML External Entity 即外部实体，攻击者通过向服务器注入指定的 XML 实体内容，从而让服务器按照指定的配置进行执行，导致问题。",
    "author": "Fan-SecLab",
    "words": 1364,
    "cjk": 1203,
    "source": "2026-07-27-xxe",
    "images": 4
  },
  {
    "url": "/posts/csrf",
    "slug": "csrf",
    "title": "CSRF攻击",
    "date": "2026-07-15",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "CSRF",
      "跨站请求伪造"
    ],
    "description": "CSRF是Web应用程序的一种常见漏洞，其攻击特性是危害性大但非常隐蔽，尤其是在大量Web 2.0技术的应用背景下，攻击者完全可以在用户毫无察觉的情况下发起CSRF攻击。",
    "author": "Fan-SecLab",
    "words": 5882,
    "cjk": 5440,
    "source": "2026-07-15-CSRF",
    "images": 45
  },
  {
    "url": "/posts/file-inclusion",
    "slug": "file-inclusion",
    "title": "文件包含漏洞",
    "date": "2026-07-12",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "文件包含漏洞"
    ],
    "description": "深入剖析PHP文件包含漏洞，从LFI/RFI到日志包含、伪协议利用、截断绕过与防御，覆盖DVWA全等级实战。",
    "author": "Fan-SecLab",
    "words": 2737,
    "cjk": 2369,
    "source": "2026-07-12-File_Inclusion",
    "images": 16
  },
  {
    "url": "/posts/web-file-parsing-vulnerability",
    "slug": "web-file-parsing-vulnerability",
    "title": "Web服务程序解析漏洞",
    "date": "2026-07-11",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "Web安全",
      "文件解析漏洞",
      "IIS",
      "Apache",
      "Nginx",
      "中间件安全"
    ],
    "description": "系统性梳理 IIS、Apache、Nginx 三大主流 Web 服务器的文件解析漏洞原理、利用方式和修复方案。",
    "author": "Fan-SecLab",
    "words": 1748,
    "cjk": 1347,
    "source": "2026-07-11-Web_File_Parsing_Vulnerability",
    "images": 12
  },
  {
    "url": "/posts/upload",
    "slug": "upload",
    "title": "文件上传漏洞",
    "date": "2026-06-21",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "文件上传漏洞"
    ],
    "description": "文件上传功能几乎是每个网站的标配——头像上传、附件提交、图片分享，处处都有上传入口。但问题在于，如果后端在处理用户上传的文件时缺乏安全意识，或者使用了有缺陷的校验逻辑，攻击者就可能通过一系列绕过手段，把恶意文件送进服务器。",
    "author": "Fan-SecLab",
    "words": 3016,
    "cjk": 2662,
    "source": "2026-07-10-upload",
    "images": 41
  },
  {
    "url": "/posts/arbitrary-file-download",
    "slug": "arbitrary-file-download",
    "title": "任意文件下载",
    "date": "2026-05-20",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "任意文件下载"
    ],
    "description": "一些网站由于业务需求，往往需要提供文件查看或文件下载功能，但若对用户查看或下载的文件不做限制，则恶意用户就能够查看或下载任意敏感文件，这就是文件查看与下载漏洞。属于owasp top10 的失效的访问控制类型了。",
    "author": "Fan-SecLab",
    "words": 1308,
    "cjk": 1122,
    "source": "2026-05-20-Arbitrary_File_Download",
    "images": 4
  },
  {
    "url": "/posts/xss-exam",
    "slug": "xss-exam",
    "title": "xss练习",
    "date": "2026-05-17",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "xss练习"
    ],
    "description": "网页源代码",
    "author": "Fan-SecLab",
    "words": 663,
    "cjk": 600,
    "source": "2026-05-17-xss_exam",
    "images": 14
  },
  {
    "url": "/posts/xss",
    "slug": "xss",
    "title": "XSS 跨站脚本攻击",
    "date": "2026-05-16",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "xss"
    ],
    "description": "XSS 全称 Cross Site Scripting（跨站脚本攻击），为了避免与 CSS 层叠样式表名称冲突，故缩写为 XSS。",
    "author": "Fan-SecLab",
    "words": 4617,
    "cjk": 4127,
    "source": "2026-05-16-xss",
    "images": 74
  },
  {
    "url": "/posts/otherdatabases",
    "slug": "otherdatabases",
    "title": "其他数据库的注入",
    "date": "2026-04-29",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "access",
      "sqlserver",
      "其他版本的mysql"
    ],
    "description": "Access 数据库采用单文件管理单数据库的架构，类似于 Excel 的工作簿。一个 .mdb 文件就是一个数据库，这一点与 MySQL 可以同时管理多个数据库截然不同。",
    "author": "Fan-SecLab",
    "words": 2005,
    "cjk": 1737,
    "source": "2026-04-25-otherdatabases",
    "images": 40
  },
  {
    "url": "/posts/use-of-the-sql",
    "slug": "use-of-the-sql",
    "title": "SQL注入点利用",
    "date": "2026-04-24",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "SQL注入点的利用"
    ],
    "description": "---",
    "author": "Fan-SecLab",
    "words": 1186,
    "cjk": 1051,
    "source": "2026-04-24-use_of_the_SQL",
    "images": 13
  },
  {
    "url": "/posts/sqlinsert",
    "slug": "sqlinsert",
    "title": "SQL注入基本原理",
    "date": "2026-04-21",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "手工SQL注入，sqlmap"
    ],
    "description": "---",
    "author": "Fan-SecLab",
    "words": 5120,
    "cjk": 4480,
    "source": "2026-04-21-SQLinsert",
    "images": 60
  },
  {
    "url": "/posts/webbug-introduction",
    "slug": "webbug-introduction",
    "title": "漏洞介绍",
    "date": "2026-04-17",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "漏洞介绍",
      "OWASP",
      "Web安全"
    ],
    "description": "OWASP（开放式 Web 应用程序安全项目）是一个开放的社区，由非营利组织 OWASP 基金会支持。对所有致力于改进应用程序安全的人士开放，旨在提高对应用程序安全性的认识。",
    "author": "Fan-SecLab",
    "words": 1367,
    "cjk": 1233,
    "source": "2026-04-17-webbug_introduction",
    "images": 2
  },
  {
    "url": "/posts/information-gathering-mobile",
    "slug": "information-gathering-mobile",
    "title": "移动端信息收集 + 溯源信息收集",
    "date": "2026-04-17",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "信息收集",
      "移动端安全",
      "溯源"
    ],
    "description": "一款 APP（抖音、快手之类的）或者一个电脑软件，都是由开发语言编写出来的。开发完成之后，想要做成可供用户下载安装的软件，需要对程序代码和运行环境等进行编译和打包。而我们下载安装 APP 到手机或电脑上的过程，其实就是解包——软件的代码程序…",
    "author": "Fan-SecLab",
    "words": 1159,
    "cjk": 1077,
    "source": "2026-04-17-information-gathering-mobile",
    "images": 4
  },
  {
    "url": "/posts/information-gathering-supplement",
    "slug": "information-gathering-supplement",
    "title": "信息收集综合利用工具",
    "date": "2026-04-16",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "信息收集",
      "Google Hack",
      "Shodan",
      "FOFA",
      "钟馗之眼"
    ],
    "description": "使用 Google 等搜索引擎对某些特定的网络主机漏洞（通常是服务器上的脚本漏洞）进行搜索，以达到快速找到漏洞主机或特定主机漏洞的目的。",
    "author": "Fan-SecLab",
    "words": 1940,
    "cjk": 1643,
    "source": "2026-04-16-information-gathering-supplement",
    "images": 8
  },
  {
    "url": "/posts/information-gathering",
    "slug": "information-gathering",
    "title": "信息收集",
    "date": "2026-04-15",
    "categories": [
      "未分类"
    ],
    "categoryColors": [
      "#94a3b8"
    ],
    "tags": [
      "JSFinder",
      "subDomainsBrute",
      "subfinder",
      "OneForAll",
      "ENScan",
      "superSearchPlus谷歌插件",
      "Bypass_cdn",
      "Nmap",
      "Wappalyzer浏览器插件",
      "御剑WEB指纹识别",
      "EHole（棱洞）7kbscan",
      "dirsearch",
      "GitHack",
      "dds_store_expis"
    ],
    "description": "渗透测试第一步——信息收集全攻略。从域名、IP、端口、指纹到敏感信息泄露，覆盖 JSFinder、subDomainsBrute、subfinder、OneForAll、Nmap、EHole、dirsearch、GitHack 等工具的实战用法。",
    "author": "Fan-SecLab",
    "words": 3769,
    "cjk": 2974,
    "source": "2026-04-15-information_gathering",
    "images": 0
  }
]

export const categories: Category[] = [
  {
    "name": "未分类",
    "color": "#94a3b8",
    "desc": "还没有分类的文章",
    "count": 24
  },
  {
    "name": "文件包含",
    "color": "#a16207",
    "desc": "",
    "count": 1
  },
  {
    "name": "ctf",
    "color": "#b45309",
    "desc": "",
    "count": 1
  }
]

export const allTags = (): { name: string; count: number }[] => {
  const map = new Map<string, number>()
  for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'))
}

export const byYear = (): { year: string; posts: Post[] }[] => {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const y = p.date.slice(0, 4)
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(p)
  }
  return [...map.entries()].map(([year, posts]) => ({ year, posts })).sort((a, b) => b.year.localeCompare(a.year))
}
