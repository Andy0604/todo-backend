import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// 1. 初始化服务和数据库客户端
const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

// 2. 配置中间件（相当于全局拦截器）
app.use(cors());          // 允许前端和外部跨域访问
app.use(express.json());  // 自动解析前端发来的 JSON 数据体

// =================================================================
// 0. 根路径保活接口 (GET /) —— 专供 UptimeRobot 监控和健康检查！
// =================================================================
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Todo & 吉趣盒真心话后端服务',
        uptime: process.uptime(),
        message: '服务 24 小时稳定运行中 🚀'
    });
});

// =================================================================
// 1. 原有的 Todo 接口（保持不变）
// =================================================================
app.get('/todos', async (req, res) => {
    try {
        const todos = await prisma.todo.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: '获取待办列表失败' });
    }
});

app.post('/todos', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: '待办内容不能为空' });
        }
        const newTodo = await prisma.todo.create({
            data: { title },
        });
        res.status(201).json(newTodo);
    } catch (error) {
        res.status(500).json({ error: '创建待办失败' });
    }
});

app.patch('/todos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, isCompleted } = req.body;
        const updatedTodo = await prisma.todo.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(isCompleted !== undefined && { isCompleted }),
            },
        });
        res.json(updatedTodo);
    } catch (error) {
        res.status(500).json({ error: '修改待办失败' });
    }
});

app.delete('/todos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.todo.delete({ where: { id } });
        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除待办失败' });
    }
});

// =================================================================
// 2. 新增：吉趣盒【真心话大冒险】题库接口
// =================================================================

// 接口 A：随机获取一道题目 (GET /questions/random?type=truth 或 ?type=dare)
app.get('/questions/random', async (req, res) => {
    try {
        const type = (req.query.type as string) || 'truth';

        // 查找对应类型的所有题目
        const list = await prisma.question.findMany({
            where: { type },
        });

        if (list.length === 0) {
            return res.json({
                content: type === 'truth' ? '你上一次放屁是在什么时候？' : '对现场任意一人深情对视10秒不许笑',
                isDefault: true,
            });
        }

        // 随机抽选一道返回
        const randomIndex = Math.floor(Math.random() * list.length);
        res.json(list[randomIndex]);
    } catch (error) {
        res.status(500).json({ error: '获取题目失败' });
    }
});

// 接口 B：新增/投稿一道题目 (POST /questions)
app.post('/questions', async (req, res) => {
    try {
        const { type, content } = req.body;
        if (!type || !content) {
            return res.status(400).json({ error: '题目类型(type)和内容(content)不能为空' });
        }

        const newQuestion = await prisma.question.create({
            data: {
                type,
                content: String(content).trim(),
            },
        });
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ error: '新增题目失败' });
    }
});

// 接口 C：获取全部题目列表 (GET /questions?type=truth)
app.get('/questions', async (req, res) => {
    try {
        const type = req.query.type as string | undefined;
        const list = await prisma.question.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: '获取题目列表失败' });
    }
});

// 3. 启动监听（'0.0.0.0' 允许云服务器接收来自公网的请求）
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务已启动！端口: ${PORT}`);
});