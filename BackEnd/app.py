from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import json
app = Flask(__name__)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clothMgmt.sqlite3'

cors = CORS(app)

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.String(50))
    name = db.Column(db.String(50))
    address = db.Column(db.String(200))
    password = db.Column(db.String(20))
    phone_no = db.Column(db.Integer)
    user_type = db.Column(db.String(10))
    date_created = db.Column(db.DateTime, default=datetime.now)
    children = db.relationship("Notification")

    def serialize(self):
        return {
            "id": self.id,
            "email_id": self.email_id,
            "name": self.name,
            "address": self.address,
            "phone_no": self.phone_no,
            "user_type": self.user_type,
            "date_created": self.date_created
        }


class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    quantity = db.Column(db.Integer)
    is_opted = db.Column(db.String(10))
    opted_user_id = db.Column(db.Integer)
    collection_status = db.Column(db.String(10))
    date_created = db.Column(db.DateTime, default=datetime.now)

    def serialize(self):
        return {
            "id": self.id,
            "parent_id": self.parent_id,
            "quantity": self.quantity,
            "is_opted": self.is_opted,
            "opted_user_id": self.opted_user_id,
            "collection_status": self.collection_status,
            "date_created": self.date_created
        }


@app.route('/rest/notify', methods=['POST'])
def notify():
    request_data = request.get_json()
    user = User.query.filter_by(email_id=request_data["user_name"]).first()
    notification = Notification(
                parent_id=user.id,
                quantity=request_data["quantity"],
                is_opted="false",
                opted_user_id="0",
                collection_status="New"
                )
    db.session.add(notification)
    db.session.commit()

    return app.response_class(
        response=json.dumps({"result": "success"}),
        status=200,
        mimetype='application/json'
    )


@app.route('/rest/user/notifications', methods=['GET'])
def get_all_notifications_of_user():
    email_id = request.args.get("email_id")
    user = User.query.filter_by(email_id=email_id).first()
    notifications = Notification.query.filter_by(parent_id=user.id).all()
    response = []
    for notification in notifications:
        response.append(notification.serialize())

    return jsonify(response)


@app.route('/rest/notifications', methods=['GET'])
def get_all_notifications():
    notifications = Notification.query.filter_by().all()
    response = []
    for notification in notifications:
        user = User.query.filter_by(id=notification.parent_id).first()
        response.append({
            "user": user.serialize(),
            "notification": notification.serialize()
        })

    return jsonify(response)


@app.route('/rest/opt-in', methods=['PUT'])
def schedule_pick_up():
    request_data = request.get_json()
    notification = Notification.query.filter_by(id=request_data["notification_id"]).first()
    notification.is_opted = "true"
    notification.opted_user_id = request_data["user_id"]
    notification.collection_status = "Scheduled"
    db.session.commit()

    return jsonify(notification.serialize())


@app.route('/rest/opt-in/update', methods=['PUT'])
def update_collection_status():
    request_data = request.get_json()
    notification = Notification.query.filter_by(id=request_data["notification_id"]).first()
    notification.opted_user_id = request_data["user_id"]
    notification.collection_status = "Collected"
    db.session.commit()

    return jsonify(notification.serialize())


@app.route('/rest/user', methods=['POST'])
def register_user():
    request_data = request.get_json()
    user = User(email_id=request_data["email_id"],
                name=request_data["name"],
                address=request_data["address"],
                phone_no=request_data["phone_no"],
                user_type=request_data["user_type"],
                password=request_data["password"]
                )
    db.session.add(user)
    db.session.commit()

    response = app.response_class(
        response=json.dumps({"result": "success"}),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/rest/login', methods=['POST'])
def login_user():
    request_data = request.get_json()
    users = User.query.filter_by(email_id=request_data["user_name"]).all()

    if len(users) > 0:

        if users[0].password == request_data["password"]:

            return jsonify(users[0].serialize())

    return app.response_class(
        response=json.dumps({"result": "Invalid Credentials"}),
        status=200,
        mimetype='application/json'
    )


@app.route('/rest/user', methods=['GET'])
def get_all_users():
    users = User.query.all()
    response = []
    for user in users:
        response.append(user.serialize())

    return jsonify(response)


@app.route('/rest/user_info', methods=['GET'])
def get_user_details():
    email_id = request.args.get("email_id")
    user = User.query.filter_by(email_id=email_id).first()
    # response = []
    # for user in users:
    #     response.append(user.serialize())

    return jsonify(user.serialize())


if __name__ == "__main__":
    app.run()
