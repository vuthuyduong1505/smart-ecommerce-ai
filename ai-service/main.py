from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Smart E-commerce AI Service",
    description="Microservice AI phục vụ tìm kiếm thông minh, gợi ý và tư vấn sản phẩm (RAG)",
    version="0.1.0"
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Health check endpoint cho AI Service."""
    return HealthResponse(
        status="UP",
        service="smart-ecommerce-ai-service",
        version="0.1.0"
    )


@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to Smart E-commerce AI Service",
        "docs_url": "/docs",
        "health_url": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
