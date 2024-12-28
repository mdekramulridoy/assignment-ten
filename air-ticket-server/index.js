const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tvoho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let visasCollection;
let visaApplicationsCollection;

async function run() {
  try {
    // await client.connect();
    const database = client.db("visaDatabase");
    visasCollection = database.collection("visas");
    visaApplicationsCollection = database.collection("visaApplications");

    console.log("Connected to MongoDB.");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}
run();

app.get("/", (req, res) => {
  res.send("Server is running ok.");
});


app.get("/visas", async (req, res) => {
  const addedBy = req.query.addedBy;

  try {
    const query = addedBy ? { addedBy } : {};
    const visas = await visasCollection.find(query).toArray();
    res.status(200).json(visas);
  } catch (err) {
    console.error("Error fetching visa data:", err);
    res.status(500).send({ message: "Failed to fetch visa data." });
  }
});

// Fetch visa by ID
app.get("/visas/:id", async (req, res) => {
  const visaId = req.params.id;

  try {
    if (!ObjectId.isValid(visaId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const visa = await visasCollection.findOne({ _id: new ObjectId(visaId) });

    if (!visa) {
      return res.status(404).json({ message: "Visa not found." });
    }

    res.json(visa);
  } catch (error) {
    console.error("Error fetching visa details:", error);
    res.status(500).json({ message: "Error fetching visa details." });
  }
});

// Add a new visa
app.post("/visas/add", async (req, res) => {
  const {
    countryImage,
    country,
    visaType,
    processingTime,
    requiredDocuments,
    description,
    ageRestriction,
    fee,
    validity,
    applicationMethod,
    addedBy,
  } = req.body;

  const newVisa = {
    countryImage: countryImage || "",
    country: country || "",
    visa_type: visaType || "Tourist visa",
    processing_time: processingTime || 0,
    required_documents: requiredDocuments?.length ? requiredDocuments : [],
    description: description || "",
    age_restriction: ageRestriction || 0,
    fee: fee || 0,
    validity: validity || "",
    application_method: applicationMethod || "online",
    addedBy: addedBy || "",
  };

  try {
    const result = await visasCollection.insertOne(newVisa);
    res.status(201).json({ message: "Visa added successfully!", visaId: result.insertedId });
  } catch (err) {
    console.error("Error adding visa:", err);
    res.status(500).send({ message: "Failed to add visa." });
  }
});

// Update visa by ID
app.put("/visas/:id", async (req, res) => {
  const visaId = req.params.id;
  const updatedVisa = req.body;

  try {
    if (!ObjectId.isValid(visaId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await visasCollection.updateOne(
      { _id: new ObjectId(visaId) },
      { $set: updatedVisa }
    );

    res.json(result);
  } catch (err) {
    console.error("Error updating visa:", err);
    res.status(500).send({ message: "Failed to update visa." });
  }
});

// Delete visa by ID
app.delete("/visas/:id", async (req, res) => {
  const visaId = req.params.id;

  try {
    if (!ObjectId.isValid(visaId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await visasCollection.deleteOne({ _id: new ObjectId(visaId) });
    res.json(result);
  } catch (err) {
    console.error("Error deleting visa:", err);
    res.status(500).send({ message: "Failed to delete visa." });
  }
});

// Add a new application
app.post("/applications", async (req, res) => {
  const {
    visaId,
    userEmail,
    firstName,
    lastName,
    country,
    visaType,
    fee,
    status,
    applicationMethod,
  } = req.body;

  try {
    if (!ObjectId.isValid(visaId)) {
      return res.status(400).json({ message: "Invalid visa ID format." });
    }

    const visa = await visasCollection.findOne({ _id: new ObjectId(visaId) });

    if (!visa) {
      return res.status(404).json({ message: "Visa not found." });
    }

    const newApplication = {
      visaId,
      userEmail,
      country,
      visaType,
      fee,
      status,
      validity: visa.validity,
      countryImage: visa.countryImage,
      applicationMethod: applicationMethod || "online",
      appliedDate: new Date().toISOString(),
      applicantFirstName: firstName,
      applicantLastName: lastName,
      applicantEmail: userEmail,
    };

    const result = await visaApplicationsCollection.insertOne(newApplication);
    res.status(201).json({ success: true, applicationId: result.insertedId });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).send({ message: "Failed to create application." });
  }
});

// Fetch all applications for a user
app.get("/applications", async (req, res) => {
  const { userEmail } = req.query;

  try {
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required." });
    }

    const applications = await visaApplicationsCollection.find({ userEmail }).toArray();
    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).send({ message: "Failed to fetch applications." });
  }
});

// Delete application by ID
app.delete("/applications/:id", async (req, res) => {
  const applicationId = req.params.id;

  try {
    if (!ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const result = await visaApplicationsCollection.deleteOne({ _id: new ObjectId(applicationId) });
    res.json(result);
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).send({ message: "Failed to delete application." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
