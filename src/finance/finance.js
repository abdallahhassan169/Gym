import { join, dirname, extname } from "path";

import fs from "fs";
import {} from "dotenv/config";

import pool from "../../db/index.js";

export const subs_costs = async (req, res) => {
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
};

export const reports = async (req, res) => {
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
};

export const add_cost = async (req, res) => {
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
};

export const cost_data = async (req, res) => {
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
};

export const bills = async (req, res) => {
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
};
