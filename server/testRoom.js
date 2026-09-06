require("dotenv").config();

const mongoose = require("mongoose");
const Room = require("./models/Room");

async function testRoomPersistence() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const testRoom = new Room({
      name: "Test Office",
      width: 1000,
      height: 700,
      obstacles: [
        {
          x: 200,
          y: 150,
          width: 150,
          height: 80,
          blocksSound: true
        },
        {
          x: 500,
          y: 300,
          width: 100,
          height: 100,
          blocksSound: true
        }
      ]
    });

    const savedRoom = await testRoom.save();

    console.log("Room saved successfully");
    console.log("Room ID:", savedRoom._id);
    console.log("Room name:", savedRoom.name);
    console.log("Room size:", savedRoom.width, "x", savedRoom.height);
    console.log("Obstacles:", savedRoom.obstacles.length);

    const foundRoom = await Room.findById(savedRoom._id);

    if (foundRoom) {
      console.log("Room retrieved successfully");
      console.log("Retrieved room:", foundRoom.name);
    }

    await Room.deleteOne({ _id: savedRoom._id });

    console.log("Test room deleted");
    console.log("Room persistence test completed");

  } catch (error) {
    console.error("Room persistence test failed:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testRoomPersistence();