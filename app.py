from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
import os
import threading
import time
import random
from datetime import datetime
from collections import deque

# Crear la aplicación Flask con la ruta correcta de plantillas
app = Flask(__name__)
CORS(app)

# Almacenamiento en memoria para los pedidos
orders_data = {
    "pending": [],      # Pedidos en el tópico (esperando ser procesados)
    "processing": [],   # Pedidos siendo procesados
    "completed": [],    # Pedidos completados
    "stats": {
        "total_orders": 0,
        "completed_orders": 0,
        "processing_orders": 0
    }
}

# Sistema de logs de Kafka
kafka_logs = deque(maxlen=100)  # Mantener los últimos 100 eventos
offset_counter = 0  # Simular offsets de Kafka

# Productos disponibles
PRODUCTS = ["Laptop", "Mouse", "Teclado", "Monitor", "Auriculares", "Webcam", "Silla Gamer", "Escritorio"]

def log_kafka_event(event_type, message, metadata=None):
    """
    Registra un evento de Kafka en el log
    event_type: 'PRODUCE', 'CONSUME', 'ACK', 'COMPLETE', 'SYSTEM'
    """
    global offset_counter
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    
    log_entry = {
        "timestamp": timestamp,
        "type": event_type,
        "message": message,
        "offset": offset_counter,
        "partition": 0,
        "metadata": metadata or {}
    }
    
    kafka_logs.append(log_entry)
    offset_counter += 1
    
    return log_entry

def generate_order():
    """Genera un pedido aleatorio"""
    return {
        "id": orders_data["stats"]["total_orders"] + 1,
        "product": random.choice(PRODUCTS),
        "quantity": random.randint(1, 3),
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "status": "pending"
    }

def producer_thread():
    """Simula el productor de Kafka"""
    while True:
        time.sleep(random.uniform(1.5, 3))
        order = generate_order()
        orders_data["stats"]["total_orders"] += 1
        orders_data["pending"].append(order)
        
        # Registrar evento de producción en Kafka
        log_kafka_event(
            "PRODUCE",
            f"Nuevo pedido enviado al tópico 'pedidos'",
            {
                "order_id": order["id"],
                "product": order["product"],
                "quantity": order["quantity"],
                "topic": "pedidos"
            }
        )

def consumer_thread():
    """Simula el consumidor de Kafka"""
    while True:
        time.sleep(0.5)
        if orders_data["pending"]:
            # Mover un pedido de pending a processing
            order = orders_data["pending"].pop(0)
            order["status"] = "processing"
            order["processing_timestamp"] = datetime.now().strftime("%H:%M:%S")
            orders_data["processing"].append(order)
            orders_data["stats"]["processing_orders"] = len(orders_data["processing"])
            
            # Registrar evento de consumo
            log_kafka_event(
                "CONSUME",
                f"Consumidor leyendo pedido del tópico",
                {
                    "order_id": order["id"],
                    "consumer_group": "order-processing-group",
                    "topic": "pedidos"
                }
            )
            
            # Registrar ACK (confirmación de recepción)
            log_kafka_event(
                "ACK",
                f"Confirmación de recepción del pedido #{order['id']}",
                {
                    "order_id": order["id"],
                    "status": "acknowledged"
                }
            )
            
            # Simular procesamiento (2-3 segundos)
            time.sleep(random.uniform(2, 3))
            
            # Mover a completado
            order["status"] = "completed"
            order["completed_timestamp"] = datetime.now().strftime("%H:%M:%S")
            orders_data["processing"].remove(order)
            orders_data["completed"].append(order)
            orders_data["stats"]["processing_orders"] = len(orders_data["processing"])
            orders_data["stats"]["completed_orders"] += 1
            
            # Registrar evento de completación
            log_kafka_event(
                "COMPLETE",
                f"Pedido #{order['id']} procesado exitosamente",
                {
                    "order_id": order["id"],
                    "product": order["product"],
                    "processing_time": f"{random.randint(2, 3)}s"
                }
            )
            
            # Mantener solo los últimos 10 completados en la vista
            if len(orders_data["completed"]) > 10:
                orders_data["completed"] = orders_data["completed"][-10:]

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/orders')
def get_orders():
    """API para obtener el estado actual de los pedidos"""
    return jsonify(orders_data)

@app.route('/api/stats')
def get_stats():
    """API para obtener estadísticas"""
    return jsonify(orders_data["stats"])

@app.route('/api/logs')
def get_logs():
    """API para obtener los logs de Kafka"""
    return jsonify({
        "logs": list(kafka_logs),
        "total_events": len(kafka_logs),
        "current_offset": offset_counter
    })

@app.route('/api/reset', methods=['POST'])
def reset_demo():
    """Reinicia la demo"""
    global orders_data, offset_counter
    orders_data = {
        "pending": [],
        "processing": [],
        "completed": [],
        "stats": {
            "total_orders": 0,
            "completed_orders": 0,
            "processing_orders": 0
        }
    }
    offset_counter = 0
    kafka_logs.clear()
    
    log_kafka_event("SYSTEM", "Demo reiniciada", {"status": "reset"})
    
    return jsonify({"status": "reset"})

if __name__ == '__main__':
    # Registrar evento de inicio
    log_kafka_event("SYSTEM", "Aplicación iniciada", {"version": "1.0"})
    
    # Iniciar los threads de productor y consumidor
    producer = threading.Thread(target=producer_thread, daemon=True)
    consumer = threading.Thread(target=consumer_thread, daemon=True)
    
    producer.start()
    consumer.start()
    
    # Iniciar la aplicación Flask
    print("=" * 60)
    print("Demo de Apache Kafka: Sistema de Pedidos en Tiempo Real")
    print("=" * 60)
    print("Abre tu navegador en: http://localhost:5000")
    print("Presiona Ctrl+C para detener la aplicación")
    print("=" * 60)
    
    app.run(debug=False, host='0.0.0.0', port=5000)
