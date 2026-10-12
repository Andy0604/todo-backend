import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// 1. 初始化服务和数据库客户端
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// 2. 配置中间件（相当于全局拦截器）
app.use(cors());          // 允许前端跨域访问
app.use(express.json());  // 自动把前端传过来的 JSON 请求体转成 JS 对象（赋值给 req.body）

// =================================================================
// 接口 1：获取所有待办 (GET /todos)
// =================================================================
app.get('/todos', async (req, res) => {
    try {
        // findMany 相当于数据库里的 SELECT *，按创建时间倒序排
        const todos = await prisma.todo.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(todos); // 直接把数组通过 JSON 返回给前端
    } catch (error) {
        res.status(500).json({ error: '获取待办列表失败' });
    }
});

// =================================================================
// 接口 2：新增一条待办 (POST /todos)
// =================================================================
app.post('/todos', async (req, res) => {
    try {
        const { title } = req.body; // 从前端传来的数据里提取 title
        if (!title) {
            return res.status(400).json({ error: '待办内容不能为空' });
        }

        // 在数据库里插入一条新数据
        const newTodo = await prisma.todo.create({
            data: {
                title: title,
                // isCompleted 默认为 false，createdAt 默认为当前时间，不用手动传
            },
        });

        res.status(201).json(newTodo); // 201 代表创建成功
    } catch (error) {
        res.status(500).json({ error: '创建待办失败' });
    }
});

// =================================================================
// 接口 3：修改待办 (PATCH /todos/:id)
// =================================================================
app.patch('/todos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id); // 注意：URL 里的参数默认是字符串，必须转成数字
        const { title, isCompleted } = req.body;

        // 更新指定 id 的待办
        const updatedTodo = await prisma.todo.update({
            where: { id: id },
            data: {
                // 前端传了哪个就改哪个，没传就不动
                ...(title !== undefined && { title }),
                ...(isCompleted !== undefined && { isCompleted }),
            },
        });

        res.json(updatedTodo);
    } catch (error) {
        res.status(500).json({ error: '修改待办失败' });
    }
});

// =================================================================
// 接口 4：删除一条待办 (DELETE /todos/:id)
// =================================================================
app.delete('/todos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id); // 转成数字

        // 从数据库中删除这条记录
        await prisma.todo.delete({
            where: { id: id },
        });

        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除待办失败' });
    }
});

// 3. 启动监听
app.listen(PORT, () => {
    console.log(`🚀 服务已启动！地址: http://localhost:${PORT}`);
});