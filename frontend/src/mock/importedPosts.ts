import csappLab1 from '@/content/posts/CSAPP-Lab1.md?raw'
import csappLab2 from '@/content/posts/CSAPP-Lab2.md?raw'
import csappLab3 from '@/content/posts/CSAPP-Lab3.md?raw'
import csappLab4 from '@/content/posts/CSAPP-Lab4.md?raw'
import csappLab5 from '@/content/posts/CSAPP-Lab5.md?raw'
import csappLab6 from '@/content/posts/CSAPP-Lab6.md?raw'
import csappLab7 from '@/content/posts/CSAPP-Lab7.md?raw'
import csappLab8 from '@/content/posts/CSAPP-Lab8.md?raw'
import networkTraceroute from '@/content/posts/Network-traceroute.md?raw'

// Vite 的 ?raw 可以把 Markdown 文件作为字符串导入，便于在纯前端中初始化文章数据。
export interface ImportedPost {
  filename: string
  raw: string
}

// 这里集中登记从旧博客迁移过来的文章，Self-Introduction.md 按需求不迁移。
export const importedPosts: ImportedPost[] = [
  { filename: 'CSAPP-Lab1.md', raw: csappLab1 },
  { filename: 'CSAPP-Lab2.md', raw: csappLab2 },
  { filename: 'CSAPP-Lab3.md', raw: csappLab3 },
  { filename: 'CSAPP-Lab4.md', raw: csappLab4 },
  { filename: 'CSAPP-Lab5.md', raw: csappLab5 },
  { filename: 'CSAPP-Lab6.md', raw: csappLab6 },
  { filename: 'CSAPP-Lab7.md', raw: csappLab7 },
  { filename: 'CSAPP-Lab8.md', raw: csappLab8 },
  { filename: 'Network-traceroute.md', raw: networkTraceroute },
]
