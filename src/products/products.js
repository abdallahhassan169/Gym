import {} from "dotenv/config";

import pool from "../../db/index.js";
export const products_shipments = async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    //selecting data
    const { rows } = await pool.query(
      `
      select pp.*,pr.name from "Gym"."Product_Transactions" pp join "Gym"."Products" pr
      on pr.id = pp.product_id
        where
       pr.name like concat('%',cast(($1)as text),'%')
      and type = 1
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
};

export const products = async (req, res) => {
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
};

export const product_reports = async (req, res) => {
  try {
    console.log(" reports data...");
    const type = req.query.type ?? null;
    const from = req.query.from;
    const to = req.query.to;

    //selecting data
    const { rows } = await pool.query(
      `
SELECT  COALESCE(sub.date_trunc ) as date
,coalesce(sub.sum,0) as profit , coalesce(cost_sum.shipment_sum,0) as cost 
,(coalesce(sub.sum,0)  - coalesce(cost_sum.shipment_sum,0) ) as total
FROM
  (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(total_price) AS sum
   FROM "Gym"."Product_Transactions" where  date between
  cast(($2) as date  ) and  cast( ($3) as date  ) and type = 2
   GROUP BY DATE_TRUNC(($1), date)  ) AS sub
   left join (SELECT DATE_TRUNC(($1), date) AS date_trunc, SUM(total_price) AS shipment_sum
   FROM "Gym"."Product_Transactions" where  date between
  cast(($2) as date  ) and  cast( ($3) as date  ) and type = 1
   GROUP BY DATE_TRUNC(($1), date)  ) as cost_sum
      on cost_sum.date_trunc = sub.date_trunc 
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
};

export const product_profit = async (req, res) => {
  try {
    console.log(" reports data...");
    const from = req.query.from;
    const to = req.query.to;

    //selecting data
    const { rows } = await pool.query(
      `


SELECT t.* , p.name
   FROM "Gym"."Product_Transactions" t
  left join "Gym"."Products" p on t.product_id = p.id
     where  t.date between
  cast(($1) as date  ) and  cast( ($2) as date  ) and type = 2
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
};

export const add_product = async (req, res) => {
  try {
    console.log(req.body);
    //selecting data
    if (!req.body.id) {
      const { rows } = await pool.query(
        `   
INSERT INTO "Gym"."Products"(
	 name , serial , availble , price) VALUES ($1, $2 , $3 , $4)
    returning id `,
        [req.body.name, req.body.serial, req.body.qty, req.body.price]
      );
    } else {
      const { rows } = await pool.query(
        `   
UPDATE "Gym"."Products"
	SET name=($1), serial=($2), availble=($3), price=($4)
	WHERE id = ($5) `,
        [
          req.body.name,
          req.body.serial,
          req.body.qty,
          req.body.price,
          req.body.id,
        ]
      );
    }
    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const add_product_transaction = async (req, res) => {
  try {
    console.log(req.body);
    //selecting data
    const { rows } = await pool.query(
      `   
INSERT INTO "Gym"."Product_Transactions"(
	 qty , product_id , total_price , date , type ) VALUES ($1, $2 , $3   , CURRENT_TIMESTAMP , $4)
    returning id `,
      [req.body.qty, req.body.product_id, req.body.qty * req.body.unit_price, 2]
    );
    if (rows[0].id) {
      const { upd } = await pool.query(
        `   
update "Gym"."Products" set availble = availble - ($1) where id = ($2) `,
        [parseInt(req.body.qty), parseInt(req.body.product_id)]
      );
    }
    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const add_shipment = async (req, res) => {
  try {
    console.log(req.body);
    const date = new Date();

    const { rows } = await pool.query(
      `   
INSERT INTO "Gym"."Product_Transactions"(
	 qty, product_id, total_price, date, type)
	VALUES ( $1, $2, $3, $4, $5)
    returning id; `,
      [
        req.body.qty,
        req.body.product_id,
        req.body.total_price,
        date.toISOString().slice(0, 18),
        1,
      ]
    );
    console.log(rows);
    if (rows[0].id) {
      const { update_qty } = await pool.query(
        `   
update "Gym"."Products" set availble = availble + ($1) where id = ($2) returning availble `,
        [req.body.qty, req.body.product_id]
      );
    }
    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};
