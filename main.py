from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Ganho
from pydantic import BaseModel
from datetime import date

Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Altere se quiser restringir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schema
class GanhoCreate(BaseModel):
    valor: float
    descricao: str
    data: date

# Rotas
@app.get("/api/earnings")
def get_ganhos(db: Session = Depends(get_db)):
    return db.query(Ganho).order_by(Ganho.data.desc()).all()

@app.post("/api/earnings")
def add_ganho(ganho: GanhoCreate, db: Session = Depends(get_db)):
    novo = Ganho(**ganho.dict())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.delete("/api/earnings/{ganho_id}")
def delete_ganho(ganho_id: int, db: Session = Depends(get_db)):
    db.query(Ganho).filter(Ganho.id == ganho_id).delete()
    db.commit()
    return {"message": "Removido"}

@app.delete("/api/earnings/clear")
def clear_earnings(db: Session = Depends(get_db)):
    db.query(Ganho).delete()
    db.commit()
    return {"message": "Zerado"}
