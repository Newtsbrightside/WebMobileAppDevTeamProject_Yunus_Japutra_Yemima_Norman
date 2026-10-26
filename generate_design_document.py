import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import shutil
import os

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set cell padding in dxa (1 pt = 20 dxa)."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)

def format_row(row, bg_hex=None, bold=False, font_size=9.5, align=WD_ALIGN_PARAGRAPH.LEFT):
    for cell in row.cells:
        if bg_hex:
            set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        for p in cell.paragraphs:
            p.alignment = align
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                run.bold = bold
                run.font.size = Pt(font_size)
                run.font.name = 'Calibri'

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(16)
    run.font.name = 'Calibri'
    run.font.color.rgb = RGBColor(30, 41, 59)
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(13)
    run.font.name = 'Calibri'
    run.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(11)
    run.font.name = 'Calibri'
    run.font.color.rgb = RGBColor(71, 85, 105)
    return p

def add_body_p(doc, text, bold_prefix=None, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.size = Pt(10)
        r_pre.font.name = 'Calibri'
    r_body = p.add_run(text)
    r_body.font.size = Pt(10)
    r_body.font.name = 'Calibri'
    r_body.italic = italic
    return p

def add_code_block(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.left_indent = Inches(0.25)
    run = p.add_run(text)
    run.font.name = 'Consolas'
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(33, 37, 41)
    return p

def main():
    src_path = 'Proposal_Web_App_Dev_Midterm_Finishline - kelompok 14.docx'
    dst_path = 'Finishline_Group14_DesignDocument.docx'

    print(f"Loading '{src_path}'...")
    doc = Document(src_path)

    # -------------------------------------------------------------
    # 1. UPDATE COVER / FIRST PAGE
    # -------------------------------------------------------------
    print("Updating Cover / First Page...")
    # Update title
    if len(doc.paragraphs) > 1:
        p1 = doc.paragraphs[1]
        p1.text = "CAPSTONE PROJECT DESIGN DOCUMENT\nWEEK 10 PROGRESS SUBMISSION\n"
        if p1.runs:
            p1.runs[0].bold = True
            p1.runs[0].font.size = Pt(14)

    # Update Table 0 (Members table NIMs)
    if len(doc.tables) > 0:
        member_table = doc.tables[0]
        # Mapping member names to NIM
        nims = {
            "Muhammad Yunus Zulfikar Putra Dwi Hakim": "01881250008",
            "Yemima Nathania Anaya": "01881250049",
            "Calvin Japutra": "01881250024",
            "Norman Abimael Zachary": "01881250019"
        }
        for row in member_table.rows:
            name_text = row.cells[0].text.strip()
            for m_name, nim in nims.items():
                if m_name in name_text:
                    row.cells[1].text = nim
                    format_row(row, font_size=10)

    # Insert metadata paragraphs right before Dosen Pengampu (around paragraph 18)
    dosen_idx = -1
    for idx, p in enumerate(doc.paragraphs[:25]):
        if 'Dosen Pengampu' in p.text:
            dosen_idx = idx
            break

    if dosen_idx != -1:
        target_p = doc.paragraphs[dosen_idx]
        def insert_meta(label, val, url=False):
            p = target_p.insert_paragraph_before()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r1 = p.add_run(f"{label}: ")
            r1.bold = True
            r1.font.size = Pt(10)
            r1.font.name = 'Calibri'
            r2 = p.add_run(val)
            r2.font.size = Pt(10)
            r2.font.name = 'Calibri'
            if url:
                r2.font.color.rgb = RGBColor(37, 99, 235)
                r2.underline = True

        insert_meta("Team Name", "Finishline (Group 14)")
        insert_meta("GitHub Repository", "https://github.com/Newtsbrightside/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman", url=True)
        insert_meta("Deployed Web Application", "https://newtsbrightside.github.io/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/#/login", url=True)
        insert_meta("Milestone", "Week 10 Progress Submission (October 2026)")
        target_p.insert_paragraph_before("") # spacing

    # -------------------------------------------------------------
    # 2. ADD SECTION 3: SYSTEM ARCHITECTURE
    # -------------------------------------------------------------
    print("Adding Section 3: System Architecture...")
    add_heading_1(doc, "Section 3 — System Architecture")
    add_body_p(doc, "Finishline utilizes a decoupled three-tier architecture separating the client-side Single Page Application (SPA), the server-side RESTful API service, and a relational database storage engine. This architecture ensures high modularity, predictable data flow, strict separation of concerns, and cross-platform expandability towards the upcoming Mobile client (React Native / Expo).")

    arch_diagram = """
+---------------------------------------------------------------------------------------------------+
|                                    FINISHLINE SYSTEM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|   +------------------------------------+             +----------------------------------------+   |
|   |         WEB FRONTEND CLIENT        |             |         MOBILE CLIENT (UPCOMING)       |   |
|   |          (React 19 + Vite)         |             |          (React Native + Expo)         |   |
|   |  - Client Storefront & Discovery   |             |  - Client Mobile Shopping Experience   |   |
|   |  - Admin Store Command Dashboard   |             |  - Push Notifications & Order Tracker  |   |
|   |  - Port: 5173 / GitHub Pages       |             |  - Mobile View / Expo Go               |   |
|   +-----------------+------------------+             +-------------------+--------------------+   |
|                     |                                                    |                        |
|                     | HTTP / REST (JSON)                                 | HTTP / REST (JSON)     |
|                     | Bearer JWT Auth                                    | Bearer JWT Auth        |
|                     v                                                    v                        |
|   +-----------------+----------------------------------------------------+--------------------+   |
|   |                                  BACKEND API SERVER                                       |   |
|   |                                (Node.js + Express.js)                                     |   |
|   |  - Port: 3000                                                                             |   |
|   |  - Middleware: CORS, express.json(), JWT Bearer Authenticator, Admin Role Guard           |   |
|   |  - Modular Routers:                                                                       |   |
|   |      * /api/auth     -> Register, Login, Token generation (bcrypt + jsonwebtoken)         |   |
|   |      * /api/shoes    -> Catalogue browsing, search/category filtering, Admin CRUD         |   |
|   |      * /api/orders   -> Atomic checkout transaction, stock decrement, order history       |   |
|   |      * /api/messages -> Finishline Concierge live customer support chat log               |   |
|   +---------------------------------------------+---------------------------------------------+   |
|                                                 |                                                 |
|                                                 | better-sqlite3 Native Driver                    |
|                                                 | Synchronous Prepared Statements + WAL Mode      |
|                                                 v                                                 |
|   +---------------------------------------------+---------------------------------------------+   |
|   |                                 RELATIONAL DATABASE ENGINE                                |   |
|   |                                  (SQLite: finishline.db)                                  |   |
|   |  - Tables: users, shoes, orders, order_items, messages                                    |   |
|   |  - Features: Foreign Key Constraints, Unique Indices, Atomic ACID Transactions            |   |
|   +-------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------+
"""
    add_code_block(doc, arch_diagram)

    add_body_p(doc, "Key architectural attributes include:")
    add_body_p(doc, "The frontend communicates with the backend exclusively through standard RESTful endpoints delivering JSON payloads. In local development, the Vite dev server provides a transparent proxy forwarding /api requests from port 5173 to port 3000, eliminating CORS friction.", bold_prefix="• Decoupled Communication: ")
    add_body_p(doc, "Stateless token-based authentication using JSON Web Tokens (JWT) signed with a server secret. Protected administrator operations enforce role validation directly within the Express middleware stack.", bold_prefix="• Security & Authentication: ")
    add_body_p(doc, "All order creation routines are executed within an atomic database transaction. If requested order quantities exceed available inventory, the entire transaction rolls back cleanly with HTTP 409 Conflict, preventing partial stock corruption.", bold_prefix="• Transactional Data Integrity: ")
    add_body_p(doc, "The frontend retains an automated fallback mechanism: when the API is unreachable (such as on static GitHub Pages), the app continues functioning seamlessly using client-side localStorage and initial seeded mock data.", bold_prefix="• Resilient Offline Fallback: ")

    # -------------------------------------------------------------
    # 3. ADD SECTION 4: DATA MODEL / ER DIAGRAM
    # -------------------------------------------------------------
    print("Adding Section 4: Data Model / ER Diagram...")
    add_heading_1(doc, "Section 4 — Data Model / ER Diagram")
    add_body_p(doc, "The Finishline database is modeled in SQLite (finishline.db). The relational schema is structured into five core tables designed to handle user accounts, footwear catalogue, customer orders, ordered line items, and live support chat messages with full foreign key constraints and transactional integrity.")

    add_heading_2(doc, "4.1 Database Table Specifications")

    # Table 4.1.1: users
    add_heading_3(doc, "Table 1: users (User Accounts & Authentication)")
    add_body_p(doc, "Stores registered client and administrator accounts, hashed security credentials, and simulated wallet balance.")
    t_users = doc.add_table(rows=6, cols=5)
    t_users.style = 'Table Grid'
    t_users.alignment = WD_TABLE_ALIGNMENT.CENTER
    u_headers = ['Column Name', 'Data Type', 'Constraints', 'Default', 'Description']
    for i, h in enumerate(u_headers):
        t_users.cell(0, i).text = h
    format_row(t_users.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)
    u_data = [
        ['id', 'INTEGER', 'PRIMARY KEY, AUTOINCREMENT', '-', 'Unique internal user identifier'],
        ['username', 'TEXT', 'NOT NULL, UNIQUE', '-', 'Unique login handle / username'],
        ['password_hash', 'TEXT', 'NOT NULL', '-', 'Bcrypt salted password hash (10 rounds)'],
        ['role', 'TEXT', 'NOT NULL', "'client'", "User authorization role ('administrator' / 'client')"],
        ['wallet_balance', 'REAL', 'NOT NULL', '0.0', 'Current balance of simulated in-app wallet in USD']
    ]
    for r_idx, row_vals in enumerate(u_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_users.cell(r_idx, c_idx).text = val
        format_row(t_users.rows[r_idx], font_size=9)

    doc.add_paragraph("")

    # Table 4.1.2: shoes
    add_heading_3(doc, "Table 2: shoes (Footwear Inventory & Catalogue)")
    add_body_p(doc, "Contains all sneaker products, categories, real-time stock levels, pricing, image URLs, and supported shoe sizes.")
    t_shoes = doc.add_table(rows=10, cols=5)
    t_shoes.style = 'Table Grid'
    t_shoes.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(u_headers):
        t_shoes.cell(0, i).text = h
    format_row(t_shoes.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)
    s_data = [
        ['id', 'TEXT', 'PRIMARY KEY', '-', "Unique product ID (e.g., 's1', 's2', or generated)"],
        ['name', 'TEXT', 'NOT NULL', '-', 'Commercial product name of the shoe'],
        ['brand', 'TEXT', 'NOT NULL', "'Finish Line'", 'Brand or manufacturer designation'],
        ['price', 'REAL', 'NOT NULL', '-', 'Unit retail price in USD ($)'],
        ['category', 'TEXT', 'NOT NULL', '-', "Shoe category ('Running', 'Casual', 'Basketball', 'Lifestyle')"],
        ['stock', 'INTEGER', 'NOT NULL', '0', 'Number of pairs currently available in inventory'],
        ['image_url', 'TEXT', 'NULLABLE', '-', 'Relative asset path or remote URL to shoe image'],
        ['description', 'TEXT', 'NULLABLE', '-', 'Product marketing narrative and technical features'],
        ['sizes', 'TEXT', 'NULLABLE', '-', "JSON string of available US shoe sizes (e.g. '[8,9,10,11,12]')"]
    ]
    for r_idx, row_vals in enumerate(s_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_shoes.cell(r_idx, c_idx).text = val
        format_row(t_shoes.rows[r_idx], font_size=9)

    doc.add_paragraph("")

    # Table 4.1.3: orders
    add_heading_3(doc, "Table 3: orders (Customer Orders)")
    add_body_p(doc, "Records placed customer purchases, delivery destination, total monetary value, and current fulfillment status.")
    t_orders = doc.add_table(rows=8, cols=5)
    t_orders.style = 'Table Grid'
    t_orders.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(u_headers):
        t_orders.cell(0, i).text = h
    format_row(t_orders.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)
    o_data = [
        ['id', 'TEXT', 'PRIMARY KEY', '-', "Human-readable order identifier (e.g. 'ORD-927758')"],
        ['user_id', 'INTEGER', 'FOREIGN KEY (users.id) ON DELETE SET NULL', 'NULL', 'ID of authenticated user who placed order (or NULL for guest)'],
        ['customer_name', 'TEXT', 'NOT NULL', '-', 'Full name of recipient for fulfillment'],
        ['delivery_address', 'TEXT', 'NOT NULL', '-', 'Shipping address provided at checkout'],
        ['total_amount', 'REAL', 'NOT NULL', '0.0', 'Total monetary amount of order in USD'],
        ['status', 'TEXT', 'NOT NULL', "'Pending'", "Fulfillment status ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')"],
        ['created_at', 'DATETIME', 'NOT NULL', 'CURRENT_TIMESTAMP', 'Timestamp of order placement in ISO 8601 format']
    ]
    for r_idx, row_vals in enumerate(o_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_orders.cell(r_idx, c_idx).text = val
        format_row(t_orders.rows[r_idx], font_size=9)

    doc.add_paragraph("")

    # Table 4.1.4: order_items
    add_heading_3(doc, "Table 4: order_items (Ordered Shoe Line Items)")
    add_body_p(doc, "Bridge entity capturing specific items, chosen shoe size, quantity, and locked unit price for each order.")
    t_items = doc.add_table(rows=7, cols=5)
    t_items.style = 'Table Grid'
    t_items.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(u_headers):
        t_items.cell(0, i).text = h
    format_row(t_items.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)
    oi_data = [
        ['id', 'INTEGER', 'PRIMARY KEY, AUTOINCREMENT', '-', 'Unique order item record ID'],
        ['order_id', 'TEXT', 'NOT NULL, FOREIGN KEY (orders.id) ON DELETE CASCADE', '-', 'Associated order parent reference'],
        ['shoe_id', 'TEXT', 'FOREIGN KEY (shoes.id) ON DELETE SET NULL', 'NULL', 'Associated shoe item in catalogue'],
        ['selected_size', 'TEXT', 'NULLABLE', '-', "Specific shoe size selected by customer (e.g. '9.5', '10')"],
        ['quantity', 'INTEGER', 'NOT NULL', '1', 'Quantity of pairs ordered for this line item'],
        ['unit_price', 'REAL', 'NOT NULL', '-', 'Historical price per unit locked at checkout time']
    ]
    for r_idx, row_vals in enumerate(oi_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_items.cell(r_idx, c_idx).text = val
        format_row(t_items.rows[r_idx], font_size=9)

    doc.add_paragraph("")

    # Table 4.1.5: messages
    add_heading_3(doc, "Table 5: messages (Finishline Concierge Live Chat)")
    add_body_p(doc, "Persists customer support dialogue exchanged between clients and store administrators.")
    t_msgs = doc.add_table(rows=6, cols=5)
    t_msgs.style = 'Table Grid'
    t_msgs.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(u_headers):
        t_msgs.cell(0, i).text = h
    format_row(t_msgs.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)
    m_data = [
        ['id', 'INTEGER', 'PRIMARY KEY, AUTOINCREMENT', '-', 'Unique chat message identifier'],
        ['sender_role', 'TEXT', 'NOT NULL', "'client'", "Role of sender ('admin' or 'client')"],
        ['sender_name', 'TEXT', 'NOT NULL', '-', "Display label of sender (e.g. 'Finishline Team', 'Client')"],
        ['text', 'TEXT', 'NOT NULL', '-', 'Content text of message'],
        ['created_at', 'DATETIME', 'NOT NULL', 'CURRENT_TIMESTAMP', 'Transmission timestamp in ISO 8601 format']
    ]
    for r_idx, row_vals in enumerate(m_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_msgs.cell(r_idx, c_idx).text = val
        format_row(t_msgs.rows[r_idx], font_size=9)

    add_heading_2(doc, "4.2 Entity Relationships & Integrity Constraints")
    add_body_p(doc, "The database enforces explicit relational constraints:")
    add_body_p(doc, "A user can place multiple orders over time. Each order optionally links to a user via orders.user_id. If a user record is deleted, ON DELETE SET NULL ensures existing sales orders remain preserved for business accounting.", bold_prefix="1. users to orders (1 : N): ")
    add_body_p(doc, "An order contains one or more line items. If an order is canceled or purged, ON DELETE CASCADE automatically removes its corresponding line items to prevent orphaned records.", bold_prefix="2. orders to order_items (1 : N): ")
    add_body_p(doc, "A shoe in the catalogue can be ordered across multiple order items. When a shoe is removed from active sales, ON DELETE SET NULL preserves past line items for historical fulfillment records.", bold_prefix="3. shoes to order_items (1 : N): ")
    add_body_p(doc, "The messages table operates as a real-time append-only communication audit trail for customer inquiries.", bold_prefix="4. messages: ")

    add_heading_2(doc, "4.3 Entity-Relationship Diagrams (ASCII & Mermaid)")
    add_body_p(doc, "Below is the relational schema diagram illustrating entities, primary/foreign keys, and cardinalities:")

    ascii_er = """
+------------------------------------+
|               USERS                |
+------------------------------------+
| PK  id             INTEGER (AUTO)  |
|     username       TEXT (UNIQUE)   |
|     password_hash  TEXT            |
|     role           TEXT            |
|     wallet_balance REAL            |
+-----------------+------------------+
                  | 1
                  |
                  | 0..*
+-----------------v------------------+              +------------------------------------+
|               ORDERS               |              |               SHOES                |
+------------------------------------+              +------------------------------------+
| PK  id               TEXT          |              | PK  id          TEXT               |
| FK  user_id          INTEGER       |              |     name        TEXT               |
|     customer_name    TEXT          |              |     brand       TEXT               |
|     delivery_address TEXT          |              |     price       REAL               |
|     total_amount     REAL          |              |     category    TEXT               |
|     status           TEXT          |              |     stock       INTEGER            |
|     created_at       DATETIME      |              |     image_url   TEXT               |
+-----------------+------------------+              |     description TEXT               |
                  | 1                               |     sizes       TEXT               |
                  |                                 +-----------------+------------------+
                  | 1..*                                              | 1
+-----------------v------------------+                                |
|            ORDER_ITEMS             |                                | 0..*
+------------------------------------+                                |
| PK  id            INTEGER (AUTO)   |                                |
| FK  order_id      TEXT             |                                |
| FK  shoe_id       TEXT             |<-------------------------------+
|     selected_size TEXT             |
|     quantity      INTEGER          |
|     unit_price    REAL             |
+------------------------------------+

+------------------------------------+
|              MESSAGES              |
+------------------------------------+
| PK  id          INTEGER (AUTO)     |
|     sender_role TEXT               |
|     sender_name TEXT               |
|     text        TEXT               |
|     created_at  DATETIME           |
+------------------------------------+
"""
    add_code_block(doc, ascii_er)

    add_heading_3(doc, "Mermaid ER Diagram Code & Instructions")
    add_body_p(doc, "The Mermaid syntax below represents the exact relational schema. To generate high-resolution PNG or SVG diagrams for presentation slides or print:")
    add_body_p(doc, "1. Copy the code block below.\n2. Open https://mermaid.live or draw.io (go to Arrange -> Insert -> Advanced -> Mermaid).\n3. Paste the code to visualize the schema interactive diagram and export as PNG/SVG.")

    mermaid_code = """```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places (user_id)"
    ORDERS ||--|{ ORDER_ITEMS : "contains (order_id)"
    SHOES ||--o{ ORDER_ITEMS : "included in (shoe_id)"

    USERS {
        INTEGER id PK "AUTOINCREMENT"
        TEXT username UK "NOT NULL"
        TEXT password_hash "NOT NULL"
        TEXT role "administrator | client"
        REAL wallet_balance "DEFAULT 0.0"
    }

    SHOES {
        TEXT id PK "e.g. s1, s2"
        TEXT name "NOT NULL"
        TEXT brand "DEFAULT 'Finish Line'"
        REAL price "NOT NULL"
        TEXT category "Running | Casual | Basketball | Lifestyle"
        INTEGER stock "DEFAULT 0"
        TEXT image_url "Product image path"
        TEXT description "Technical specs"
        TEXT sizes "JSON array of sizes"
    }

    ORDERS {
        TEXT id PK "e.g. ORD-927758"
        INTEGER user_id FK "REFERENCES users(id)"
        TEXT customer_name "NOT NULL"
        TEXT delivery_address "NOT NULL"
        REAL total_amount "NOT NULL"
        TEXT status "Pending | Processing | Shipped | Delivered | Cancelled"
        DATETIME created_at "ISO 8601"
    }

    ORDER_ITEMS {
        INTEGER id PK "AUTOINCREMENT"
        TEXT order_id FK "REFERENCES orders(id)"
        TEXT shoe_id FK "REFERENCES shoes(id)"
        TEXT selected_size "e.g. 9, 10.5"
        INTEGER quantity "DEFAULT 1"
        REAL unit_price "Locked purchase price"
    }

    MESSAGES {
        INTEGER id PK "AUTOINCREMENT"
        TEXT sender_role "admin | client"
        TEXT sender_name "Display name"
        TEXT text "Message body"
        DATETIME created_at "ISO 8601"
    }
```"""
    add_code_block(doc, mermaid_code)

    # -------------------------------------------------------------
    # 4. ADD SECTION 5: API ENDPOINTS
    # -------------------------------------------------------------
    print("Adding Section 5: API Endpoints...")
    add_heading_1(doc, "Section 5 — API Endpoints")
    add_body_p(doc, "The Finishline backend server provides a RESTful API listening on http://localhost:3000. All routes accept and return application/json payloads. Protected endpoints verify authorization via the Authorization: Bearer <token> header containing a signed JSON Web Token (JWT). The table below documents every endpoint implemented in the Week 10 backend:")

    t_api = doc.add_table(rows=16, cols=6)
    t_api.style = 'Table Grid'
    t_api.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ['Method', 'Route / Endpoint', 'Auth Required', 'Description', 'Request Body', 'Response Format & Status']
    for i, h in enumerate(api_headers):
        t_api.cell(0, i).text = h
    format_row(t_api.rows[0], bg_hex="E2E8F0", bold=True, font_size=8.5)

    api_data = [
        ['POST', '/api/auth/register', 'None (Public)', 'Register a new client account with bcrypt hash', '{"username": "...", "password": "...", "role": "client"}', '201 Created: {"message", "token", "user": {id, username, role, wallet_balance}}'],
        ['POST', '/api/auth/login', 'None (Public)', 'Authenticate credentials and obtain JWT token', '{"username": "...", "password": "..."}', '200 OK: {"message", "token", "user": {id, username, role, wallet_balance}}'],
        ['GET', '/api/auth/me', 'Bearer JWT', 'Retrieve profile of currently authenticated user', 'None', '200 OK: {"user": {id, username, role, wallet_balance}}'],
        ['GET', '/api/shoes', 'None (Public)', 'Retrieve shoe catalogue with optional search/filter', 'Query: ?search=...&category=...&sort=...', '200 OK: Array of shoe objects [{id, name, price, stock, sizes, image_url, ...}]'],
        ['GET', '/api/shoes/:id', 'None (Public)', 'Retrieve single footwear product by ID', 'None', '200 OK: Single shoe object {id, name, price, stock, sizes, ...}'],
        ['POST', '/api/shoes', 'Admin (JWT)', 'Add a new shoe model to store inventory', '{"name", "brand", "price", "category", "stock", "image_url", "description", "sizes"}', '201 Created: Newly created shoe object with assigned ID'],
        ['PUT', '/api/shoes/:id', 'Admin (JWT)', 'Update shoe price, stock level, details, or image', '{"price"?, "stock"?, "category"?, "image_url"?, ...}', '200 OK: Updated shoe object with persisted changes'],
        ['DELETE', '/api/shoes/:id', 'Admin (JWT)', 'Delete a footwear product from inventory', 'None', '200 OK: {"message": "Shoe deleted successfully.", "id": "..."}'],
        ['POST', '/api/orders', 'Optional', 'Place customer order; atomic inventory stock decrement', '{"customer": {name, address}, "items": [{id, quantity, selectedSize}], "total"}', '201 Created: Order object with status "Pending" and items breakdown'],
        ['GET', '/api/orders/mine', 'Client (JWT)', 'Retrieve authenticated client own order history', 'None', '200 OK: Array of client past orders with line items'],
        ['GET', '/api/orders', 'Admin (JWT)', 'Retrieve all store client orders for fulfillment', 'None', '200 OK: Array of all customer orders across store with items'],
        ['PUT', '/api/orders/:id/status', 'Admin (JWT)', 'Update order fulfillment lifecycle status', '{"status": "Processing" | "Shipped" | "Delivered" | "Cancelled"}', '200 OK: Updated order record with new fulfillment status'],
        ['PUT', '/api/orders/:id', 'Admin (JWT)', 'Alias to update order status directly', '{"status": "..."}', '200 OK: Updated order record'],
        ['GET', '/api/messages', 'None (Public)', 'Retrieve live support chat history', 'None', '200 OK: Array of message records [{id, sender, sender_name, text, time}]'],
        ['POST', '/api/messages', 'Optional', 'Post customer support query or administrator reply', '{"text": "...", "sender"?: "client" | "admin", "sender_name"?: "..."}', '201 Created: Newly created message object {id, sender, sender_name, text, time}']
    ]

    for r_idx, row_vals in enumerate(api_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_api.cell(r_idx, c_idx).text = val
        format_row(t_api.rows[r_idx], font_size=8)

    add_body_p(doc, "Authentication Details:", bold_prefix="Note on Security: ")
    add_body_p(doc, "JWT tokens generated during /api/auth/login and /api/auth/register contain the payload { id, username, role } and expire after 7 days. The frontend automatically stores this token in localStorage and includes it in all subsequent authorized requests. For backward compatibility with mock tests, the server also honors x-role: administrator fallback headers.")

    # -------------------------------------------------------------
    # 5. ADD SECTION 8: TASK BREAKDOWN & PROGRESS LOG
    # -------------------------------------------------------------
    print("Adding Section 8: Task Breakdown & Progress Log...")
    add_heading_1(doc, "Section 8 — Task Breakdown & Progress Log")
    add_body_p(doc, "This section outlines the division of responsibilities across the development team and logs milestone progress from project initiation through Week 10 completion and planning towards final delivery.")

    add_heading_2(doc, "8.1 Team Member Responsibility Matrix")
    t_team = doc.add_table(rows=5, cols=4)
    t_team.style = 'Table Grid'
    t_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    team_headers = ['Team Member', 'Student ID (NIM)', 'Primary Role', 'Key Responsibilities']
    for i, h in enumerate(team_headers):
        t_team.cell(0, i).text = h
    format_row(t_team.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)

    team_data = [
        [
            'Muhammad Yunus Zulfikar Putra Dwi Hakim',
            '01881250008',
            'Backend Developer & Database Specialist',
            'Design SQLite schema (users, shoes, orders, order_items, messages), implement Express REST API endpoints, JWT authentication & password hashing, atomic order stock transaction, and backend documentation.'
        ],
        [
            'Yemima Nathania Anaya',
            '01881250049',
            'Frontend UI/UX & Client Experience',
            'Develop Client Storefront, catalogue browsing with real-time category filters and search, size chart modal, shopping bag drawer with free-shipping progress indicator, and design document wireframes.'
        ],
        [
            'Calvin Japutra',
            '01881250024',
            'Store Analytics & Admin Features',
            'Build administrator "Store Command" dashboard, live sales and inventory metrics, Add New Shoe form, stock editing table, order fulfillment status management, and presentation deck.'
        ],
        [
            'Norman Abimael Zachary',
            '01881250019',
            'Authentication, State & Testing',
            'Build React Context state management (AuthContext & StoreContext), API service layer with localStorage fallback mechanism, GitHub Actions Pages deployment pipeline, and integration test validation.'
        ]
    ]

    for r_idx, row_vals in enumerate(team_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_team.cell(r_idx, c_idx).text = val
        format_row(t_team.rows[r_idx], font_size=8.5)

    doc.add_paragraph("")

    add_heading_2(doc, "8.2 Milestone Progress Tracker (Week by Week)")
    add_body_p(doc, "The table below tracks development progress against syllabus checkpoints. Deliverables up to Week 10 (database design, backend implementation, CRUD/Auth endpoints, and frontend-backend integration) are completed.")

    t_prog = doc.add_table(rows=14, cols=5)
    t_prog.style = 'Table Grid'
    t_prog.alignment = WD_TABLE_ALIGNMENT.CENTER
    prog_headers = ['Task / Milestone', 'Assigned Owner', 'Target Milestone', 'Status', 'Deliverable Summary']
    for i, h in enumerate(prog_headers):
        t_prog.cell(0, i).text = h
    format_row(t_prog.rows[0], bg_hex="E2E8F0", bold=True, font_size=9)

    prog_data = [
        ['Design use cases & UI wireframes', 'All Members', 'Week 7', '✅ Completed', 'Complete use case diagram, written use cases, and screen wireframes.'],
        ['Build Web client & admin prototype', 'Yemima & Calvin', 'Week 7', '✅ Completed', 'Interactive React 19 + Vite prototype with localStorage mock state.'],
        ['Deploy Web app to GitHub Pages', 'Norman', 'Week 7', '✅ Completed', 'Automated CI/CD deployment pipeline via GitHub Actions.'],
        ['Design database schema & migrations', 'Yunus', 'Week 9', '✅ Completed', 'SQLite schema with 5 tables, foreign keys, and seed datasets.'],
        ['Build Express backend + JWT auth', 'Yunus', 'Week 10', '✅ Completed', 'Modular Express server with bcrypt password hashing and JWT token issuance.'],
        ['Implement Shoes CRUD & Orders API', 'Yunus', 'Week 10', '✅ Completed', 'Full catalogue CRUD, atomic checkout stock deduction, order history.'],
        ['Connect frontend to backend API', 'Yunus + Norman', 'Week 10', '✅ Completed', 'src/api/api.js service with Vite dev proxy and offline fallback.'],
        ['Update Design Document (.docx)', 'All Members', 'Week 10', '✅ Completed', 'Complete Sections 1-8 matching Week 10 Capstone submission standard.'],
        ['Plan AI sneaker recommendation feature', 'All Members', 'Week 11', '🔄 In Progress', 'Define prompt architecture for AI concierge shoe style advisor.'],
        ['Build Mobile app screens (Expo)', 'Yemima + Calvin', 'Week 12', '⬜ Not Started', 'React Native screens for browsing, cart, and mobile checkout.'],
        ['Connect Mobile app to Express backend', 'Yunus + Norman', 'Week 13', '⬜ Not Started', 'Mobile API service integration with backend server.'],
        ['Backend cloud hosting deployment', 'Yunus', 'Week 13', '⬜ Not Started', 'Deploy Express + database service to cloud container hosting.'],
        ['Integrate AI recommendation endpoint', 'All Members', 'Week 14', '⬜ Not Started', 'Connect /api/ai/recommend endpoint to frontend and mobile chat.'],
    ]

    for r_idx, row_vals in enumerate(prog_data, start=1):
        for c_idx, val in enumerate(row_vals):
            t_prog.cell(r_idx, c_idx).text = val
        format_row(t_prog.rows[r_idx], font_size=8.5)

    print(f"Saving updated document to '{dst_path}'...")
    doc.save(dst_path)
    print(f"✅ Successfully created '{dst_path}'!")

if __name__ == '__main__':
    main()
