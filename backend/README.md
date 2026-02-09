# Fund Monitor Backend

## 快速开始

### 1. 创建虚拟环境
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 启动服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 访问 API 文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/funds/search` | GET | 搜索基金 |
| `/api/funds/{code}/realtime` | GET | 获取基金实时估值 |
| `/api/funds/realtime/batch` | POST | 批量获取实时估值 |
| `/api/funds/{code}/detail` | GET | 获取基金详情 |
| `/api/funds/{code}/holdings` | GET | 获取基金持仓 |
| `/api/funds/{code}/nav-history` | GET | 获取历史净值 |
