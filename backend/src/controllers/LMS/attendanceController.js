import { Attendance } from "../../models/LMS/attendance.model.js";
import { Batch } from "../../models/LMS/batch.model.js";
import { Lecture } from "../../models/LMS/lecture.model.js";
import { Student } from "../../models/student.model.js";

/*
    creates a lecture for a particular batch and teacher.
    takes lecture_name, lecture_type, date, batch and teacher in request body.
*/
export const createLecture = async (req, res) => {
    const { lecture_name, lecture_type, date, batch, teacher } = req.body;

    try {
        const doesBatchExists = await Batch.findById(batch);
        if (!doesBatchExists) {
            return res.status(400).json({ success: false, message: "Batch not found" });
        }

        const lecture = await Lecture.create({
            lecture_name,
            lecture_type,
            date,
            batch,
            teacher
        })
        if (!lecture) {
            return res.status(400).json({ success: false, message: "There was a Error creating the lecture" });
        }

        return res.status(201).json({ success: true, message: "Lecture created successfully", lecture });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

export const getLectures = async (req, res) => {
    const {batchId} = req.params;
    try {
        const lectures = await Lecture.find({batch:batchId});
        if (!lectures || lectures.length === 0) {
            return res.status(404).json({ success: false, message: "No lectures found" });
        }
        return res.status(200).json({ success: true, message: "Lectures found", lectures });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
        
    }
}
/*
    this function is used to mark the attendance of all the students in the batch for a particular lecture
    takes batchId, lectureId, absentRollnos (multiple roll nos) and teacherId (markedBy) in request body.
    takes absentRollnos to mark them absent and marks remaining other students as present automatically.
*/
export const markAttendance = async (req, res) => {
    const { attendance_name, batchId, lectureId, absentRollnos, markedBy } = req.body;

    try {
        const doesLectureExists = await Lecture.findById(lectureId);
        if (!doesLectureExists) {
            return res.status(400).json({ success: false, message: "Lecture/Lab not found" });
        }

        const batchStudents = await Student.find({ batch: batchId });
        if (batchStudents.length === 0) {
            return res.status(404).json({ success: false, message: "No students found in this batch" });
        }
        console.log(batchStudents.length);
        const absentRollnosToUpperCase = absentRollnos.map((rollno) => rollno.toUpperCase());

        const attendanceRecord = [];

        let presentCount = 0;
        let absentCount = 0;
        const errors = [];

        for (const student of batchStudents) {
            const isAbsent = absentRollnosToUpperCase.includes(student.rollno);

            const attendanceObj = {
                attendance_name,
                lecture: lectureId,
                student: student._id,
                status: isAbsent ? 'Absent' : 'Present',
                markedby: markedBy,
            }

            attendanceRecord.push(attendanceObj);

            if (isAbsent) {
                absentCount++;
            } else {
                presentCount++;
            }
        }

        try {
            await Attendance.insertMany(attendanceRecord, { ordered: false });
        } catch (err) {
            if (err.code === 11000) {
                errors.push({ message: "Attendance already marked for this student" });
            } else {
                console.error("Error inserting attendance:", err);
                errors.push({ message: "Error marking attendance" });
            }
        }

        return res.status(201).json({ success: true, message: "Attendance marked successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// GET API to get the attendance statistics for a particular lecture
export const getAttendanceStatistic = async (req,res)=> {
    const {lectureId} = req.params;

    try {

        if(!lectureId){
            return res.status(404).json({success : false,message : "Lecture not found"});
        }

        const attendanceRecord = await Attendance.find({lecture : lectureId})
            .populate("student","name rollno")
            .populate("lecture","lecture_name lecture_type date")
            .populate("markedby","teacher_name")

        const totalAttendance = attendanceRecord.length;
        const presentCount = attendanceRecord.filter(record => record.status ==="Present").length;
        const absentCount = totalAttendance - presentCount;

        const totalPercentage = presentCount > 0 ? (presentCount / totalAttendance)*100 : 0;

        return res.status(201).json({
            success : true,
            message : "Attendance Statistics for this lecture",
            data : {
                Record : attendanceRecord,
                Total_Attendance : totalAttendance,
                Students_Present : presentCount,
                Students_Absent : absentCount,
                Present_Percent : totalPercentage.toFixed(2) + "%",
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}