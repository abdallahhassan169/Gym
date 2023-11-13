import {} from "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db/index.js";
import { join, dirname, extname } from "path";
import fs from "fs";
import QRCode from "qrcode";
import multer from "multer";
import { fileURLToPath } from "url";

// Create a function to scan the QR code from an image file

const app = express();
app.use(express.json());
app.use(cors());
const upload = multer({ dest: "cost_images/" });
app.get("/types", async (req, res) => {
  try {
    console.log("Fetching types data...");

    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".user_type `
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/sports", async (req, res) => {
  try {
    console.log("Fetching types data...");

    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".sports `
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/img", async (req, res) => {
  try {
    const user_id = req.query.id;

    //selecting data

    const { rows } = await pool.query(
      `   
select qr_code_name from "Gym".users where id = ($1) `,
      [user_id]
    );
    console.log(rows);
    //mapping and cast the date

    res.sendFile(`${process.cwd()}/qrs/${rows[0]?.qr_code_name}`);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/user_by_id", async (req, res) => {
  try {
    console.log("Fetching types data...");
    const user_id = req.query.user_id;
    const date = new Date();

    //selecting data

    const { rows } = await pool.query(
      `   
select u.* , t.name as type_name,
 s.name as sport_name
 from "Gym".users u join
 "Gym".sports s on s.id = u.id_sport join
 "Gym".user_type t on t.id = id_user_type
 where u.id =($1)
 
 `,
      [user_id]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.post("/scan", async (req, res) => {
  try {
    const date = new Date();
    const code = req.body.code;
    console.log(code);
    const user_id = req.query.user_id;
    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".users 
 where qr_code = ($1)
 `,
      [code]
    );

    const { log } = await pool.query(
      `   
          INSERT INTO "Gym".users_log(
	 user_id, "time")
	VALUES ((select id from "Gym".users where qr_code =($1) ) , (CURRENT_TIMESTAMP ))
 
 `,
      [code]
    );
    console.log(rows, "rows");
    //mapping and cast the date
    if ((rows[0].classes_num > 0) & (rows[0].reg_end_date > date.getDate())) {
      const new_classes_num = parseInt(rows[0].classes_num) - 1;
      const { update } = await pool.query(
        `   
update   "Gym".users set classes_num =($1)
 where qr_code = ($2) returning id
 `,
        [new_classes_num, code]
      );
      console.log(update);
      res.send({ id: String(rows[0].id), exist: true });
    } else {
      console.log(rows);
      res.send({ id: String(rows[0].id), exist: false });
    }
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/users", async (req, res) => {
  try {
    console.log("Fetching users data...");
    const query = req.query.query;
    const type = req.query.type;
    const limit = req.query.limit;
    const offset = req.query.offset;
    const sport = req.query.sport;
    //selecting data

    const { rows } = await pool.query(
      `   
SELECT u.* , s.name as sport_name ,
    t.name as type_name
	FROM "Gym"."users" u 
    JOIN "Gym"."user_type" t
     ON u.id_user_type = t.id
     join "Gym".sports s on
     u.id_sport = s.id
     WHERE
   ( u.name like '%'||($1)||'%' or
    u.phone like '%'||($1)||'%'or
     u.email like '%'||($1)||'%' or
     t.name like '%'||($1)||'%'
    ) and
     id_sport = ($4)
    order by id desc
    LIMIT ($2) OFFSET($3)  ; `,
      [query, 20, offset, sport]
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/users_log", async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    //selecting data
    const { rows } = await pool.query(
      `
      select u.name,u.phone, ul.* from "Gym"."users_log" ul join
       "Gym"."users" u on u.id = ul.user_id  
       where u.name like concat('%',cast(($1) as text) ,'%')
        and (cast (time as date) ) between cast(($2) as date) and cast(($5) as date)
        
        order by id desc limit ($3) offset ($4)
  ; `,
      [query, req.query.from, req.query.limit, req.query.offset, req.query.to]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/product_prices", async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    //selecting data
    const { rows } = await pool.query(
      `
      select pp.*,pr.name from "Gym"."Product_Price" pp join "Gym"."Products" pr
      on pr.id = pp.product_id
        where
       pr.name like concat('%',cast(($1)as text),'%')
      
        order by pp.id desc limit ($2) offset ($3)   
  ; `,
      [query, req.query.limit, req.query.offset]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/products", async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    //selecting data
    const { rows } = await pool.query(
      `
      select * from "Gym"."Products"  where
       name like concat('%',cast(($1)as text),'%')
      
        order by id desc limit ($2) offset ($3)
  ; `,
      [query, req.query.limit, req.query.offset]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/subs_costs", async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    const type = req.query.type;
    //selecting data
    console.log(query, type);
    const { rows } = await pool.query(
      `
      select * from "Gym"."Finanace" where id_type =($2)
      and (cast(date as text) like concat('%',cast(($1) as text),'%')
       or client_name like concat('%',($1),'%') or description like concat('%',($1),'%'))  order by id desc limit ($3)
       offset ($4)
  ; `,
      [query, type, req.query.limit, req.query.offset]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.get("/reports", async (req, res) => {
  try {
    console.log(" reports data...");
    const type = req.query.type ?? null;
    const from = req.query.from;
    const to = req.query.to;

    //selecting data
    const { rows } = await pool.query(
      `

SELECT  COALESCE(sub.date_trunc , cost.date_trunc , dev_cost.date_trunc) as date
,coalesce(sub.sum,0),
 coalesce(cost.sum,0) AS cost_sum, coalesce(sub.sum,0) AS sub_sum ,coalesce(dev_cost.sum,0) AS dev_cost ,
coalesce(sub.sum,0)-coalesce(cost.sum,0)   as total
FROM
  (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(cost) AS sum
   FROM "Gym"."Finanace" where id_type =2 and date between
  cast(($2) as date  ) and  cast( ($3) as date  )
   GROUP BY DATE_TRUNC(($1), date)  ) AS sub 
full outer join
  (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(cost) AS sum
   FROM "Gym"."Finanace" where id_type=1 and date between
  cast(($2) as date  ) and  cast( ($3) as date  )
   GROUP BY DATE_TRUNC(($1), date )) AS cost
ON cost.date_trunc = sub.date_trunc

full outer join
  (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(cost) AS sum
   FROM "Gym"."Finanace" where id_type=3 and date between
  cast(($2) as date  ) and  cast( ($3) as date  )
   GROUP BY DATE_TRUNC(($1), date )) AS dev_cost
   ON cost.date_trunc = dev_cost.date_trunc
order by 1 desc limit ($4) offset ($5) ;
  ; `,
      [type, from, to, req.query.limit, req.query.offset]
    );
    rows.map((el, idx) => {
      el["id"] = idx;
    });
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/product_reports", async (req, res) => {
  try {
    console.log(" reports data...");
    const type = req.query.type ?? null;
    const from = req.query.from;
    const to = req.query.to;

    //selecting data
    const { rows } = await pool.query(
      `
SELECT  COALESCE(sub.date_trunc ) as date
,coalesce(sub.sum,0) as sum 

FROM
  (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(total_price) AS sum
   FROM "Gym"."Product_Transactions" where  date between
  cast(($2) as date  ) and  cast( ($3) as date  )
   GROUP BY DATE_TRUNC(($1), date)  ) AS sub 

order by 1 desc limit ($4) offset($5) ;
  ; `,
      [type, from, to, req.query.limit, req.query.offset]
    );
    rows.map((el, idx) => {
      el["id"] = idx;
    });
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/product_transactions", async (req, res) => {
  try {
    console.log(" reports data...");
    const from = req.query.from;
    const to = req.query.to;

    //selecting data
    const { rows } = await pool.query(
      `


SELECT t.* , p.name
   FROM "Gym"."Product_Transactions" t
   left join "Gym"."Product_Price" pp on t.product_price_id = pp.id
  left join "Gym"."Products" p on pp.product_id = p.id
     where  t.date between
  cast(($1) as date  ) and  cast( ($2) as date  )
order by t.id desc limit ($3) offset($4) ;
  ; `,
      [from, to, req.query.limit, req.query.offset]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_user", async (req, res) => {
  try {
    console.log(req.body);
    const dataString = JSON.stringify(req.body);
    //selecting data
    const { rows } = await pool.query(
      `   
INSERT INTO "Gym".users(
	 name, email, phone, birth_day,  id_user_type ,qr_code , qr_code_name,id_sport, classes_num)
	VALUES ($1, $2,  $3, $4 , $5 ,$6 ,$7,$8,$9)  returning id `,
      [
        req.body.name,
        req.body.email,
        req.body.phone,
        req.body.birth_day,
        req.body.id_user_type,
        dataString,
        `${req.body.email}.png`,
        req.body.id_sport,
        0,
      ]
    );

    const qrCodeImage = await QRCode.toFile(
      `qrs/${req.body.email}.png`,
      dataString
    );

    //mapping and cast the date

    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_product", async (req, res) => {
  try {
    console.log(req.body);
    //selecting data
    const { rows } = await pool.query(
      `   
INSERT INTO "Gym"."Products"(
	 name , serial) VALUES ($1, $2)
    returning id `,
      [req.body.name, req.body.serial]
    );

    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_product_transaction", async (req, res) => {
  try {
    console.log(req.body);
    //selecting data
    const { rows } = await pool.query(
      `   
INSERT INTO "Gym"."Product_Transactions"(
	 qty , product_price_id , total_price , date ) VALUES ($1, $2 , $3 , CURRENT_TIMESTAMP)
    returning id `,
      [
        req.body.qty,
        req.body.product_price_id,
        req.body.qty * req.body.unit_price,
      ]
    );
    const { upd } = await pool.query(
      `   
update "Gym"."Product_Price" set qty = qty - ($1) where id = ($2) `,
      [parseInt(req.body.qty), parseInt(req.body.product_price_id)]
    );
    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_product_price", async (req, res) => {
  try {
    console.log(req.body);
    const date = new Date();
    if (!req.body.id) {
      const { rows } = await pool.query(
        `   
INSERT INTO "Gym"."Product_Price"(
	 qty,product_id , unit_price , total_price , date , total_qty ) VALUES ($1, $2,$3,$4,$5,$6)
    returning id `,
        [
          req.body.qty,
          req.body.product_id,
          req.body.unit_price,
          req.body.total_price,
          date.toISOString().slice(0, 18),
          req.body.qty,
        ]
      );

      res.json("add succefully");
    } else {
      const { rows } = await pool.query(
        `   
update "Gym"."Product_Price" 
	 set qty = ($1)  , unit_price  = ($2) , total_price =($3) where id = ($4)  
    returning id `,
        [req.body.qty, req.body.unit_price, req.body.total_price, req.body.id]
      );

      res.json("add succefully");
    }
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_reg", async (req, res) => {
  try {
    console.log("Fetching users data...");

    //selecting data
    const date = new Date();
    const { rows } = await pool.query(
      `
      update "Gym".users set reg_start_date = ($1) ,  reg_end_date = ($2) ,  classes_num = ($3) , cost = ($4)
      where id = ($5) returning "Gym".users.name
 `,
      [
        req.body.reg_start_date,
        req.body.reg_end_date,
        req.body.classes_num,
        req.body.cost,
        req.body.id,
      ]
    );
    const { sub } = await pool.query(
      `
     INSERT INTO "Gym"."Finanace"(
	 client_name,  cost, id_type , date )
	VALUES (($1), ($2), ($3) , ($4));
 `,
      [rows[0].name, req.body.cost, 2, date.toISOString().slice(0, 10)]
    );
    res.json("updated succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.post("/add_cost", upload.single("image"), async (req, res) => {
  try {
    console.log("adding cost data...");

    const date = new Date();
    const imageFile = req?.file ?? null;
    const jsonData = JSON.parse(req.body.data);
    const data = [
      jsonData.description,
      jsonData.cost,
      jsonData.type,
      date.toLocaleString().slice(0, 20),
    ];
    if (imageFile) {
      const extension = extname(imageFile?.originalname); // Get the file extension

      // Rename the uploaded file with the extension
      const newFileName = `${imageFile?.filename}${extension}`;
      const newFilePath = join(
        dirname(fileURLToPath(import.meta.url)),
        "cost_images",
        newFileName
      );
      data.push(newFilePath);
      fs.renameSync(imageFile?.path, newFilePath);
    } else data.push(null);
    //selecting data

    const { rows } = await pool.query(
      `
    INSERT INTO "Gym"."Finanace"(
	 description,   cost, id_type, date,img)
	VALUES ( ($1), ($2), ($3), ($4), ($5));
 `,
      data
    );

    res.json("inserted succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/bills", async (req, res) => {
  // Retrieve the image file
  const id = req.query.id;

  // Send the image file and JSON data in the response
  const { rows } = await pool.query(
    `   
select * from "Gym"."Finanace" where id = ($1) `,
    [id]
  );

  if (rows[0].img !== null) {
    const imagePath = `${rows[0].img}`;
    const image = fs.readFileSync(imagePath);
    res.writeHead(200, {
      "Content-Type": "multipart/form-data",
      "Content-Disposition": "attachment; filename=image.jpg",
    });
    res.write(image);
  } else res.send("no image found");
});

app.get("/cost_data", async (req, res) => {
  try {
    const id = req.query.id;
    console.log("Fetching bills data...");

    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym"."Finanace" where id = ($1) `,
      [id]
    );
    console.log(rows);
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
});
app.listen(3012, () => {
  console.log(`server is up on port ${3012}`);
});
