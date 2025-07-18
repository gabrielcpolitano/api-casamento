from sqlalchemy import Column, Integer, String, Numeric, Date
from database import Base

class Ganho(Base):
    __tablename__ = "ganhos"

    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Numeric, nullable=False)
    descricao = Column(String, nullable=False)
    data = Column(Date, nullable=False)
