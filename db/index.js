const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb://layertacdemyadmin:layertacdemyadmin%40123@ac-evthc2w-shard-00-00.p6ib5z5.mongodb.net:27017,ac-evthc2w-shard-00-01.p6ib5z5.mongodb.net:27017,ac-evthc2w-shard-00-02.p6ib5z5.mongodb.net:27017/LeyartAcademydb?ssl=true&replicaSet=atlas-apbezx-shard-0&authSource=admin&appName=Cluster0"
  )

  .then(() => console.log("Connected MongoDB"))
  .catch((e) => console.error(e));

// mongoose.connect("mongodb://127.0.0.1:27017/LeyartAcademydb")
//   .then(() => console.log("✅ Connected to local MongoDB"))
//   .catch(err => console.error("❌ Connection failed:", err));
