"""
Visual Hospital Simulation Layer
Game-like animated view of hospital workflow
Uses p5.js for smooth animations and spatial representation
"""

import streamlit as st
import streamlit.components.v1 as components
import json

def create_hospital_visualization_html(snapshot, current_time):
    """
    Create animated hospital visualization showing:
    - Patient arrival and entry
    - History taking
    - ABDM record retrieval
    - Reconciliation and flagging
    - Triage classification
    - Queue assignment
    - Room admission
    - Patient flow throughout
    """
    
    # Convert snapshot data to JavaScript-friendly format with safety checks
    patients_data = []
    for pid, patient in snapshot.patients.items():
        try:
            patients_data.append({
                'id': patient.id,
                'triage': patient.triage_stage_2 or patient.triage_stage_1 or 'ARRIVING',
                'status': str(patient.status) if patient.status else 'UNKNOWN',  # Safe conversion
                'wait_time': current_time - patient.arrival_time if patient.arrival_time else 0,
                'arrival_time': patient.arrival_time if patient.arrival_time else 0,
                'complaint': (patient.chief_complaint[:30] + '...' if len(patient.chief_complaint) > 30 else patient.chief_complaint) if patient.chief_complaint else 'N/A',
                'age': patient.age if patient.age else 0,
                'has_history': len(patient.history) > 0 if patient.history else False
            })
        except Exception as e:
            # Skip patients that cause errors
            print(f"Warning: Skipping patient {pid}: {e}")
            continue
    
    queues_data = {
        'RED': list(snapshot.queues.get('RED', [])),
        'YELLOW': list(snapshot.queues.get('YELLOW', [])),
        'BLUE': list(snapshot.queues.get('BLUE', []))
    }
    
    rooms_data = []
    for room in snapshot.rooms:
        try:
            rooms_data.append({
                'name': room.name if room.name else 'Unknown',
                'type': str(room.room_type) if room.room_type else 'UNKNOWN',  # Safe conversion
                'capacity': room.capacity_per_minute if room.capacity_per_minute else 1,
                'current': room.current_load if room.current_load else 0,
                'utilization': (room.current_load / room.capacity_per_minute * 100) if (room.capacity_per_minute and room.capacity_per_minute > 0) else 0
            })
        except Exception as e:
            # Skip rooms that cause errors
            print(f"Warning: Skipping room: {e}")
            continue
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
        <style>
            body {{
                margin: 0;
                padding: 0;
                overflow: hidden;
                background: #f5f5f5;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }}
            #hospital-canvas {{
                display: block;
                margin: 0 auto;
            }}
        </style>
    </head>
    <body>
        <script>
            // Data from Python (properly serialized as JSON)
            const patientsData = {json.dumps(patients_data)};
            const queuesData = {json.dumps(queues_data)};
            const roomsData = {json.dumps(rooms_data)};
            const currentTime = {current_time};
            
            // Hospital Layout Constants
            const CANVAS_WIDTH = 1200;
            const CANVAS_HEIGHT = 700;
            
            // Areas
            const ENTRANCE = {{x: 50, y: 350, w: 100, h: 100}};
            const HISTORY_DESK = {{x: 200, y: 300, w: 120, h: 100}};
            const ABDM_STATION = {{x: 350, y: 280, w: 120, h: 140}};
            const TRIAGE_AREA = {{x: 500, y: 250, w: 140, h: 180}};
            const QUEUE_AREA = {{x: 680, y: 150, w: 180, h: 450}};
            const ROOM_AREA = {{x: 900, y: 150, w: 260, h: 450}};
            
            // Patient tokens
            let patientTokens = [];
            
            class PatientToken {{
                constructor(data) {{
                    this.id = data.id;
                    this.triage = data.triage;
                    this.status = data.status;
                    this.complaint = data.complaint;
                    this.age = data.age;
                    this.hasHistory = data.has_history;
                    this.waitTime = data.wait_time;
                    
                    // Animation state
                    this.x = ENTRANCE.x + 50;
                    this.y = ENTRANCE.y + 50;
                    this.targetX = this.x;
                    this.targetY = this.y;
                    this.stage = 'ARRIVING';
                    this.stageProgress = 0;
                    
                    // Visual
                    this.size = 20;
                    this.pulsePhase = random(TWO_PI);
                    
                    this.determinePosition();
                }}
                
                determinePosition() {{
                    // Determine stage and target position based on status
                    if (this.status === 'WAITING') {{
                        if (this.triage === 'ARRIVING' || !this.triage) {{
                            this.stage = 'HISTORY';
                            this.targetX = HISTORY_DESK.x + random(20, 100);
                            this.targetY = HISTORY_DESK.y + random(20, 80);
                        }} else if (this.stageProgress < 0.3) {{
                            this.stage = 'ABDM_CHECK';
                            this.targetX = ABDM_STATION.x + random(20, 100);
                            this.targetY = ABDM_STATION.y + random(20, 120);
                        }} else if (this.stageProgress < 0.6) {{
                            this.stage = 'TRIAGE';
                            this.targetX = TRIAGE_AREA.x + random(20, 120);
                            this.targetY = TRIAGE_AREA.y + random(20, 160);
                        }} else {{
                            this.stage = 'QUEUE';
                            let queueIndex = 0;
                            if (queuesData.RED.includes(this.id)) queueIndex = 0;
                            else if (queuesData.YELLOW.includes(this.id)) queueIndex = 1;
                            else if (queuesData.BLUE.includes(this.id)) queueIndex = 2;
                            
                            this.targetX = QUEUE_AREA.x + 30 + queueIndex * 55;
                            let posInQueue = 0;
                            if (queuesData.RED.includes(this.id)) posInQueue = queuesData.RED.indexOf(this.id);
                            else if (queuesData.YELLOW.includes(this.id)) posInQueue = queuesData.YELLOW.indexOf(this.id);
                            else if (queuesData.BLUE.includes(this.id)) posInQueue = queuesData.BLUE.indexOf(this.id);
                            
                            this.targetY = QUEUE_AREA.y + 50 + posInQueue * 30;
                        }}
                    }} else if (this.status === 'ADMITTED') {{
                        this.stage = 'ROOM';
                        this.targetX = ROOM_AREA.x + random(40, 220);
                        this.targetY = ROOM_AREA.y + random(40, 410);
                    }}
                }}
                
                update() {{
                    // Smooth movement
                    let dx = this.targetX - this.x;
                    let dy = this.targetY - this.y;
                    this.x += dx * 0.1;
                    this.y += dy * 0.1;
                    
                    // Update stage progress
                    this.stageProgress += 0.01;
                    if (this.stageProgress > 1) this.stageProgress = 1;
                    
                    // Pulse animation
                    this.pulsePhase += 0.1;
                }}
                
                draw() {{
                    push();
                    translate(this.x, this.y);
                    
                    // Color based on triage
                    let col;
                    if (this.triage === 'RED') col = color(255, 50, 50);
                    else if (this.triage === 'YELLOW') col = color(255, 200, 50);
                    else if (this.triage === 'BLUE') col = color(100, 150, 255);
                    else col = color(200, 200, 200);
                    
                    // Pulsing glow for waiting patients
                    if (this.status === 'WAITING') {{
                        let glowSize = this.size + sin(this.pulsePhase) * 3;
                        fill(red(col), green(col), blue(col), 50);
                        noStroke();
                        circle(0, 0, glowSize * 1.5);
                    }}
                    
                    // Main token
                    fill(col);
                    stroke(0);
                    strokeWeight(2);
                    circle(0, 0, this.size);
                    
                    // ID label
                    fill(0);
                    noStroke();
                    textAlign(CENTER, CENTER);
                    textSize(10);
                    text(this.id, 0, 0);
                    
                    pop();
                }}
                
                drawTooltip() {{
                    if (dist(mouseX, mouseY, this.x, this.y) < this.size) {{
                        push();
                        fill(0, 0, 0, 230);
                        stroke(255);
                        strokeWeight(1);
                        rect(mouseX + 10, mouseY - 30, 200, 80, 5);
                        
                        fill(255);
                        noStroke();
                        textAlign(LEFT, TOP);
                        textSize(12);
                        text(`Patient #${{this.id}}`, mouseX + 15, mouseY - 25);
                        text(`Triage: ${{this.triage}}`, mouseX + 15, mouseY - 5);
                        text(`Complaint: ${{this.complaint}}`, mouseX + 15, mouseY + 15);
                        text(`Wait: ${{Math.floor(this.waitTime)}}s`, mouseX + 15, mouseY + 35);
                        pop();
                    }}
                }}
            }}
            
            function setup() {{
                createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
                
                // Create patient tokens
                patientsData.forEach(data => {{
                    patientTokens.push(new PatientToken(data));
                }});
            }}
            
            function draw() {{
                background(245);
                
                // Draw hospital layout
                drawHospitalLayout();
                
                // Update and draw patients
                patientTokens.forEach(token => {{
                    token.update();
                    token.draw();
                }});
                
                // Draw tooltips on top
                patientTokens.forEach(token => {{
                    token.drawTooltip();
                }});
                
                // Draw info panel
                drawInfoPanel();
            }}
            
            function drawHospitalLayout() {{
                // Entrance
                fill(150, 200, 150, 100);
                stroke(100, 150, 100);
                strokeWeight(2);
                rect(ENTRANCE.x, ENTRANCE.y, ENTRANCE.w, ENTRANCE.h, 10);
                fill(0);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(14);
                text('🚪 ENTRANCE', ENTRANCE.x + ENTRANCE.w/2, ENTRANCE.y + ENTRANCE.h/2);
                
                // History Desk
                fill(200, 200, 250, 100);
                stroke(150, 150, 200);
                strokeWeight(2);
                rect(HISTORY_DESK.x, HISTORY_DESK.y, HISTORY_DESK.w, HISTORY_DESK.h, 10);
                fill(0);
                noStroke();
                text('📋 HISTORY', HISTORY_DESK.x + HISTORY_DESK.w/2, HISTORY_DESK.y + 30);
                text('TAKING', HISTORY_DESK.x + HISTORY_DESK.w/2, HISTORY_DESK.y + 50);
                
                // ABDM Station
                fill(180, 220, 255, 100);
                stroke(100, 170, 220);
                strokeWeight(2);
                rect(ABDM_STATION.x, ABDM_STATION.y, ABDM_STATION.w, ABDM_STATION.h, 10);
                fill(0);
                noStroke();
                text('🔗 ABDM', ABDM_STATION.x + ABDM_STATION.w/2, ABDM_STATION.y + 35);
                text('RECORDS', ABDM_STATION.x + ABDM_STATION.w/2, ABDM_STATION.y + 55);
                text('CHECK', ABDM_STATION.x + ABDM_STATION.w/2, ABDM_STATION.y + 75);
                
                // Triage Area
                fill(255, 220, 180, 100);
                stroke(220, 180, 140);
                strokeWeight(2);
                rect(TRIAGE_AREA.x, TRIAGE_AREA.y, TRIAGE_AREA.w, TRIAGE_AREA.h, 10);
                fill(0);
                noStroke();
                text('🔬 TRIAGE', TRIAGE_AREA.x + TRIAGE_AREA.w/2, TRIAGE_AREA.y + 50);
                text('CLASSIFICATION', TRIAGE_AREA.x + TRIAGE_AREA.w/2, TRIAGE_AREA.y + 70);
                
                // Queue Area
                fill(255, 255, 220, 100);
                stroke(200, 200, 150);
                strokeWeight(2);
                rect(QUEUE_AREA.x, QUEUE_AREA.y, QUEUE_AREA.w, QUEUE_AREA.h, 10);
                
                // Queue lanes
                fill(0);
                noStroke();
                textAlign(CENTER, TOP);
                text('🔴 RED', QUEUE_AREA.x + 30, QUEUE_AREA.y + 10);
                text('🟡 YELLOW', QUEUE_AREA.x + 90, QUEUE_AREA.y + 10);
                text('🔵 BLUE', QUEUE_AREA.x + 150, QUEUE_AREA.y + 10);
                
                stroke(200);
                strokeWeight(1);
                line(QUEUE_AREA.x + 60, QUEUE_AREA.y + 35, QUEUE_AREA.x + 60, QUEUE_AREA.y + QUEUE_AREA.h - 10);
                line(QUEUE_AREA.x + 120, QUEUE_AREA.y + 35, QUEUE_AREA.x + 120, QUEUE_AREA.y + QUEUE_AREA.h - 10);
                
                // Room Area
                fill(220, 255, 220, 100);
                stroke(170, 220, 170);
                strokeWeight(2);
                rect(ROOM_AREA.x, ROOM_AREA.y, ROOM_AREA.w, ROOM_AREA.h, 10);
                fill(0);
                noStroke();
                textAlign(CENTER, TOP);
                textSize(16);
                text('🏥 TREATMENT ROOMS', ROOM_AREA.x + ROOM_AREA.w/2, ROOM_AREA.y + 15);
                
                // Draw room status boxes
                let roomY = ROOM_AREA.y + 50;
                roomsData.forEach(room => {{
                    let util = room.utilization;
                    let roomColor;
                    if (util >= 100) roomColor = color(255, 100, 100);
                    else if (util >= 80) roomColor = color(255, 200, 100);
                    else roomColor = color(100, 255, 100);
                    
                    fill(roomColor, 150);
                    stroke(0);
                    strokeWeight(1);
                    rect(ROOM_AREA.x + 20, roomY, ROOM_AREA.w - 40, 40, 5);
                    
                    fill(0);
                    noStroke();
                    textAlign(LEFT, CENTER);
                    textSize(11);
                    text(`${{room.name}}: ${{room.current}}/${{room.capacity}}`, ROOM_AREA.x + 30, roomY + 20);
                    
                    roomY += 50;
                }});
                
                // Arrows showing flow
                drawArrow(ENTRANCE.x + ENTRANCE.w, ENTRANCE.y + ENTRANCE.h/2, HISTORY_DESK.x, HISTORY_DESK.y + HISTORY_DESK.h/2);
                drawArrow(HISTORY_DESK.x + HISTORY_DESK.w, HISTORY_DESK.y + HISTORY_DESK.h/2, ABDM_STATION.x, ABDM_STATION.y + ABDM_STATION.h/2);
                drawArrow(ABDM_STATION.x + ABDM_STATION.w, ABDM_STATION.y + ABDM_STATION.h/2, TRIAGE_AREA.x, TRIAGE_AREA.y + TRIAGE_AREA.h/2);
                drawArrow(TRIAGE_AREA.x + TRIAGE_AREA.w, TRIAGE_AREA.y + TRIAGE_AREA.h/2, QUEUE_AREA.x, QUEUE_AREA.y + QUEUE_AREA.h/2);
                drawArrow(QUEUE_AREA.x + QUEUE_AREA.w, QUEUE_AREA.y + QUEUE_AREA.h/2, ROOM_AREA.x, ROOM_AREA.y + ROOM_AREA.h/2);
            }}
            
            function drawArrow(x1, y1, x2, y2) {{
                stroke(150, 150, 150, 100);
                strokeWeight(2);
                line(x1, y1, x2, y2);
                
                // Arrow head
                push();
                let angle = atan2(y2 - y1, x2 - x1);
                translate(x2, y2);
                rotate(angle);
                fill(150, 150, 150, 100);
                noStroke();
                triangle(0, 0, -10, -5, -10, 5);
                pop();
            }}
            
            function drawInfoPanel() {{
                // Info box at top
                fill(255, 255, 255, 230);
                stroke(0);
                strokeWeight(2);
                rect(10, 10, 300, 120, 10);
                
                fill(0);
                noStroke();
                textAlign(LEFT, TOP);
                textSize(14);
                text(`⏱️ Simulation Time: ${{currentTime}}s`, 20, 20);
                text(`👥 Total Patients: ${{patientsData.length}}`, 20, 45);
                
                let waiting = patientsData.filter(p => p.status === 'WAITING').length;
                let admitted = patientsData.filter(p => p.status === 'ADMITTED').length;
                
                text(`⏳ Waiting: ${{waiting}}`, 20, 70);
                text(`✅ Admitted: ${{admitted}}`, 20, 95);
                
                // Legend
                fill(255, 255, 255, 230);
                stroke(0);
                strokeWeight(2);
                rect(CANVAS_WIDTH - 210, 10, 200, 130, 10);
                
                fill(0);
                noStroke();
                textAlign(LEFT, TOP);
                textSize(12);
                text('WORKFLOW STAGES:', CANVAS_WIDTH - 200, 20);
                
                fill(255, 50, 50);
                circle(CANVAS_WIDTH - 190, 50, 15);
                fill(0);
                text('RED - Critical', CANVAS_WIDTH - 170, 45);
                
                fill(255, 200, 50);
                circle(CANVAS_WIDTH - 190, 75, 15);
                fill(0);
                text('YELLOW - Urgent', CANVAS_WIDTH - 170, 70);
                
                fill(100, 150, 255);
                circle(CANVAS_WIDTH - 190, 100, 15);
                fill(0);
                text('BLUE - Routine', CANVAS_WIDTH - 170, 95);
                
                fill(200, 200, 200);
                circle(CANVAS_WIDTH - 190, 125, 15);
                fill(0);
                text('GRAY - Arriving', CANVAS_WIDTH - 170, 120);
            }}
        </script>
    </body>
    </html>
    """
    
    return html_content


def render_visual_simulation(controller):
    """Render the animated hospital visualization"""
    snapshot = controller.get_current_snapshot()
    current_time = controller.current_time
    
    html = create_hospital_visualization_html(snapshot, current_time)
    components.html(html, height=720, scrolling=False)
