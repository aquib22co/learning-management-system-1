import { Student } from "../models/student.model.js";
import {upload} from "../middlewares/multer.js";
import path from "path";

export const uploadExperimentFile = async (req, res) => {

    try {
        const { rollno } = req.body;
        const { subject_name } = req.params;
        const file = req.file;

        if (!subject_name) {
            return res.status(400).json({ success: false, message: "Subject name is missing" });
        }

        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Prepare the new file path
        const filePath = path.join("/public/uploads", rollno.toUpperCase(), "assignments", subject_name, file.filename);

        // Update the student document
        const result = await Student.updateOne(
            { 
                rollno: rollno.toUpperCase(),
                "experiments.subject_name": subject_name 
            },
            { 
                $set: { 
                    "experiments.$.folder_path": path.dirname(filePath),
                    "experiments.$.filePath": filePath
                }
            }
        );

        // If no document was modified, it means the experiment doesn't exist yet
        if (result.modifiedCount === 0) {
            // Add a new experiment
            await Student.updateOne(
                { rollno: rollno.toUpperCase() },
                { 
                    $push: { 
                        experiments: {
                            subject_name: subject_name,
                            folder_path: path.dirname(filePath),
                            filePath: filePath
                        }
                    }
                }
            );
        }

        res.status(200).json({ success: true, message: "File uploaded successfully", filePath });
    } catch (error) {
        console.error("Error uploading experiment file:", error);
        res.status(500).json({ success: false, message: "Error uploading file", error: error.message });
    }
};