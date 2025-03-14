import express, { query } from "express";
import db from "../config/database.js";
import { ObjectId } from "mongodb";
import cron from "node-cron";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/authMiddleware.js";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";

const API_ROOT = process.env.VITE_ROOT_API;

const router = express.Router();
const transaction = db.collection("transaction");
const userSchema = db.collection("user");

// ตั้งค่า Cron Job ให้รันทุก ๆ วันที่ 1
cron.schedule("0 0 1 * *", async () => {
    try {
        console.log("Fetching user IDs...");
        const users = await userSchema.find({}, { projection: { _id: 1, email: 1 } }).toArray();

        // หาค่าเดือนและปีที่ผ่านมาจากวันที่ปัจจุบัน
        const now = new Date();
        const previousMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
        const previousMonthNumber = previousMonth.getMonth() + 1; // Get the previous month (1-based index)
        const previousYear = previousMonth.getFullYear();

        for (const user of users) {
            const userId = user._id.toString();
            const email = user.email;

            console.log(`Generating report for user: ${userId} (${email})`);

            // เรียก API เพื่อดึงไฟล์ Excel
            const response = await fetch(`http://localhost:5000/test/exportTransactions/${userId}?month=${previousMonthNumber}&year=${previousYear}`);
            if (!response.ok) throw new Error(`Failed to fetch report for ${userId}`);

            // ใช้ arrayBuffer() แทน buffer()
            const arrayBuffer = await response.arrayBuffer();
            const excelBuffer = Buffer.from(arrayBuffer);

            // ตั้งค่า Nodemailer
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "sit.invest.pl3@gmail.com",
                    pass: "xgss blmw aakh jpww",
                },
            });

            // หาค่าเดือนก่อนหน้า
            const now = new Date();
            const previousMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
            const startOfMonth = new Date(Date.UTC(previousMonth.getFullYear(), previousMonth.getMonth(), 1));
            
            // ตั้งค่าอีเมล
            let mailOptions = {
                from: "sit.invest.pl3@gmail.com",
                to: email,
                subject: "Your Monthly Transaction Report",
                text: "Attached is your monthly transaction report.",
                attachments: [
                    {
                        filename: `Transaction_Report_${startOfMonth.toLocaleString('default', { month: 'long' })}.xlsx`,
                        content: excelBuffer
                    }
                ]
            };

            // ส่งอีเมล
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${email}`);
        }
    } catch (error) {
        console.error("Error in cron job:", error);
    }
});

router.get("/exportTransactions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { year, month } = req.query; // รับค่า year และ month จาก query

        // ตรวจสอบ userId ว่าถูกต้องหรือไม่
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send("Invalid userId");
        }

        // กำหนดค่าปัจจุบัน
        const now = new Date();
        let startOfMonth, endOfMonth;

        if (!year && !month) {
            // ถ้าไม่มีปีและเดือน ให้ดึงข้อมูลทั้งหมด
            startOfMonth = new Date(0); // เริ่มต้นจาก 1 มกราคม 1970
            endOfMonth = new Date();
        } else if (year && !month) {
            // ถ้ามีแค่ปี ให้ดึงข้อมูลตั้งแต่วันที่ 1 มกราคม ปีนั้นถึง 31 ธันวาคม
            startOfMonth = new Date(`${year}-01-01T00:00:00.000Z`);
            endOfMonth = new Date(`${year}-12-31T23:59:59.999Z`);
        } else if (!year && month) {
            // ถ้ามีแค่เดือน ให้ดึงข้อมูลจากวันที่ 1 เดือนนั้นถึงวันสุดท้ายของเดือนนั้น
            startOfMonth = new Date(Date.UTC(now.getFullYear(), month - 1, 1));
            endOfMonth = new Date(Date.UTC(now.getFullYear(), month, 0)); // วันสุดท้ายของเดือน
            endOfMonth.setUTCHours(23, 59, 59, 999);
        } else if (year && month) {
            // ถ้ามีทั้งปีและเดือน ให้ดึงข้อมูลตั้งแต่วันที่ 1 เดือนนั้นถึงวันสุดท้ายของเดือน
            startOfMonth = new Date(Date.UTC(year, month - 1, 1));
            endOfMonth = new Date(Date.UTC(year, month, 0)); // วันสุดท้ายของเดือน
            endOfMonth.setUTCHours(23, 59, 59, 999);
        }

        // แปลงเป็น ISODate
        const startOfMonthISO = startOfMonth.toISOString();
        const endOfMonthISO = endOfMonth.toISOString();

        // ดึงข้อมูลจากฐานข้อมูลตามช่วงเวลาที่กำหนด
        const transactions = await transaction.find({
            status: "match",
            userId: userId,
            date: {
                $gte: startOfMonthISO,
                $lt: endOfMonthISO
            }
        }).toArray();

        // สร้างไฟล์ Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Transactions ${startOfMonth.toLocaleString('default', { month: 'long' })}`); // ชื่อชีทจะเป็นชื่อเดือน

        // หัวตาราง
        worksheet.columns = [
            { header: "Symbol", key: "symbol", width: 10 },
            { header: "Action", key: "action", width: 10 },
            { header: "Total Amount", key: "totalAmount", width: 15 },
            { header: "Quantity", key: "quantity", width: 10 },
            { header: "Date", key: "date", width: 20 }
        ];

        worksheet.getRow(1).height = 30;  // กำหนดให้แถวที่ 1 มีความสูง 30 จุด

        // เพิ่มสีและการตกแต่งแถวที่ 1 (header)
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            if (colNumber === 1) {
                cell.style = { 
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fbd183' } }, 
                    font: { color: { argb: '000000' }, bold: true }, // สีตัวอักษรดำและตัวหนา
                    border: { top: { style: 'thin', color: { argb: '000000' } }, 
                              left: { style: 'thin', color: { argb: '000000' } }, 
                              bottom: { style: 'thin', color: { argb: '000000' } }, 
                              right: { style: 'thin', color: { argb: '000000' } } }
                };
            } else if (colNumber === 2) {
                cell.style = { 
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '98FB98' } }, 
                    font: { color: { argb: '000000' }, bold: true }, // สีตัวอักษรดำและตัวหนา
                    border: { top: { style: 'thin', color: { argb: '000000' } }, 
                              left: { style: 'thin', color: { argb: '000000' } }, 
                              bottom: { style: 'thin', color: { argb: '000000' } }, 
                              right: { style: 'thin', color: { argb: '000000' } } }
                };
            } else if (colNumber === 3) {
                cell.style = { 
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '80b4ff' } }, 
                    font: { color: { argb: '000000' }, bold: true }, // สีตัวอักษรดำและตัวหนา
                    border: { top: { style: 'thin', color: { argb: '000000' } }, 
                              left: { style: 'thin', color: { argb: '000000' } }, 
                              bottom: { style: 'thin', color: { argb: '000000' } }, 
                              right: { style: 'thin', color: { argb: '000000' } } }
                };
            } else if (colNumber === 4) {
                cell.style = { 
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFACD' } }, // สีพื้นหลังเหลืองอ่อน
                    font: { color: { argb: '000000' }, bold: true }, // สีตัวอักษรดำและตัวหนา
                    border: { top: { style: 'thin', color: { argb: '000000' } }, 
                              left: { style: 'thin', color: { argb: '000000' } }, 
                              bottom: { style: 'thin', color: { argb: '000000' } }, 
                              right: { style: 'thin', color: { argb: '000000' } } }
                };
            } else if (colNumber === 5) {
                cell.style = { 
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } }, // สีพื้นหลังเทาอ่อน
                    font: { color: { argb: '000000' }, bold: true }, // สีตัวอักษรดำและตัวหนา
                    border: { top: { style: 'thin', color: { argb: '000000' } }, 
                              left: { style: 'thin', color: { argb: '000000' } }, 
                              bottom: { style: 'thin', color: { argb: '000000' } }, 
                              right: { style: 'thin', color: { argb: '000000' } } }
                };
            }
        });

        // เพิ่มข้อมูลลงใน Excel
        transactions.forEach((tx) => {
            const row = worksheet.addRow({
                symbol: tx.symbol,
                action: tx.action.toUpperCase(),
                totalAmount: tx.totalAmount,
                quantity: tx.quantity,
                date: new Date(tx.date).toISOString().split("T")[0],
            });

            // กำหนดสีพื้นหลังของคอลัมน์ Action ตามเงื่อนไข
            const actionCell = row.getCell('action');
            if (tx.action.toUpperCase() === 'BUY') {
                actionCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '00C6EFCE' } // สีเขียวอ่อน
                };
            } else if (tx.action.toUpperCase() === 'SELL') {
                actionCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '00FFC7CE' } // สีแดงอ่อน
                };
            }

            // กำหนดเส้นขอบ (Border) ให้ทุกเซลล์ในแถว
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: '000000' } },
                    left: { style: 'thin', color: { argb: '000000' } },
                    bottom: { style: 'thin', color: { argb: '000000' } },
                    right: { style: 'thin', color: { argb: '000000' } }
                };
            });
        });

        // คำนวณยอดรวมของ BUY และ SELL
        let buyTotal = 0;
        let sellTotal = 0;

        // คำนวณผลรวมของ BUY และ SELL
        transactions.forEach((tx) => {
            if (tx.action === "buy") {
                buyTotal += tx.totalAmount;
            } else if (tx.action === "sell") {
                sellTotal += tx.totalAmount;
            }
        });

        // สรุป BUY และ SELL ในชีทเดียวกัน
        const summarySheet = workbook.addWorksheet("Summary");
        summarySheet.columns = [
            { header: "Action", key: "action", width: 20, alignment: { horizontal: "left" } },
            { header: "Total Amount (USD)", key: "totalAmount", width: 20, alignment: { horizontal: "left" } }
        ];

        // ตกแต่ง Header
        const sumHeaderRow = summarySheet.getRow(1);
        sumHeaderRow.font = { bold: true, color: { argb: "000000" } }; // ตัวหนา สีดำ
        sumHeaderRow.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'D3D3D3' } // พื้นหลังสีเทาอ่อน
        };

        // เพิ่ม Border ให้ Header
        sumHeaderRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: '000000' } },
                left: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } },
                right: { style: 'thin', color: { argb: '000000' } }
            };
        });

        // เพิ่มข้อมูลในชีท Summary
        const buyRow = summarySheet.addRow({ action: "BUY", totalAmount: buyTotal });
        const sellRow = summarySheet.addRow({ action: "SELL", totalAmount: sellTotal });

        // กำหนดสีของค่า BUY และ SELL
        if (buyTotal > 0) {
            buyRow.getCell(2).font = { color: { argb: "008000" } }; // สีเขียวสำหรับ BUY
        }
        if (sellTotal > 0) {
            sellRow.getCell(2).font = { color: { argb: "FF0000" } }; // สีแดงสำหรับ SELL
        }

        // เพิ่ม Border ให้ข้อมูล
        [buyRow, sellRow].forEach((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: '000000' } },
                    left: { style: 'thin', color: { argb: '000000' } },
                    bottom: { style: 'thin', color: { argb: '000000' } },
                    right: { style: 'thin', color: { argb: '000000' } }
                };
            });
        });


        // กำหนดชื่อไฟล์
        const fileName = (year && month)
    ? `Transaction_Report_${year}_${new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' })}.xlsx`
    : (year || month)
    ? `Transaction_Report_${year || new Date().getFullYear()}_${new Date(`${year || new Date().getFullYear()}-${month || new Date().getMonth() + 1}-01`).toLocaleString('default', { month: 'long' })}.xlsx`
    : `Transaction_Report_All.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        
        // ส่งไฟล์ Excel
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error exporting Excel:", error);
        res.status(500).send("Error generating Excel file.");
    }
});


export default router;
