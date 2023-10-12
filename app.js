const express = require("express");
const app = express();

app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbpath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

let statuses = ["TO DO", "IN PROGRESS", "DONE"];
let priorities = ["HIGH", "MEDIUM", "LOW"];
let categories = ["WORK", "HOME", "LEARNING"];
// API 1

// scenario 1
const hasStatusAPI1 = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityAPI1 = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityStatusAPI1 = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryStatusAPI1 = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryPriorityAPI1 = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAPI1 = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const getDesiredAPI = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    category: item.category,
    priority: item.priority,
    status: item.status,
    dueDate: item.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  switch (true) {
    case hasPriorityStatusAPI1(request.query):
      // scenario 3
      if (priorities.includes(priority)) {
        if (statuses.includes(status)) {
          const getSC3API1Query = `select * from todo where priority like '${priority}' and status like '${status}' ;`;
          const dbSC3Response = await db.all(getSC3API1Query);
          response.send(dbSC3Response.map((eachObj) => getDesiredAPI(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryStatusAPI1(request.query):
      // scenario 6
      if (categories.includes(category)) {
        if (statuses.includes(status)) {
          const getSC6API1Query = `select * from todo where category like '${category}' and status like '${status}' ;`;
          const dbSC6Response = await db.all(getSC6API1Query);
          response.send(dbSC6Response.map((eachObj) => getDesiredAPI(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryPriorityAPI1(request.query):
      // scenario 7

      if (categories.includes(category)) {
        if (priorities.includes(priority)) {
          const getSC7API1Query = `select * from todo where category = '${category}' and priority = '${priority}' ;`;
          const dbSC7Response = await db.all(getSC7API1Query);
          //console.log(dbSC7Response);
          response.send(dbSC7Response.map((eachObj) => getDesiredAPI(eachObj)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasStatusAPI1(request.query):
      // scenario 1
      if (statuses.includes(status)) {
        const getSC1API1Query = `select * from todo where status like '${status}' ;`;
        const dbSC1Response = await db.all(getSC1API1Query);
        response.send(dbSC1Response.map((eachObj) => getDesiredAPI(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityAPI1(request.query):
      // scenario 2
      if (priorities.includes(priority)) {
        const getSC2API1Query = `select * from todo where priority like '${priority}' ;`;
        const dbSC2Response = await db.all(getSC2API1Query);
        response.send(dbSC2Response.map((eachObj) => getDesiredAPI(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAPI1(request.query):
      // scenario 5
      if (categories.includes(category)) {
        const getSC5API1Query = `select * from todo where category like '${category}' ;`;
        const dbSC5Response = await db.all(getSC5API1Query);
        response.send(dbSC5Response.map((eachObj) => getDesiredAPI(eachObj)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      const getSC4API1Query = `select * from todo where todo like '%${search_q}%';`;
      const dbSC4Response = await db.all(getSC4API1Query);
      response.send(dbSC4Response.map((eachObj) => getDesiredAPI(eachObj)));
      break;
  }
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getAPI2Query = `select * from todo where id = ${todoId};`;
  const dbAPI2Response = await db.get(getAPI2Query);
  response.send(getDesiredAPI(dbAPI2Response));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(isValid(new Date(date)));
  if (isValid(new Date(date))) {
    //
    const dateReq = format(new Date(date), "yyyy-MM-dd");
    //console.log(dateReq);
    // console.log(
    // `${dateReq.getFullYear()}-${dateReq.getMonth()}-${dateReq.getDate()}`
    // );
    const getAPI3Query = `select * from todo where due_date = '${dateReq}';`;
    const dbAPI3Response = await db.all(getAPI3Query);
    response.send(dbAPI3Response.map((eachObj) => getDesiredAPI(eachObj)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (statuses.includes(status)) {
    if (priorities.includes(priority)) {
      if (categories.includes(category)) {
        if (isValid(new Date(dueDate))) {
          const dateReq = format(new Date(dueDate), "yyyy-MM-dd");
          const postAPI4Query = `insert into todo (id, todo, priority, status, category, due_date) values (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dateReq}');`;
          await db.run(postAPI4Query);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

// API 5

const hasStatusInBody = (requestBody) => {
  let { status } = requestBody;
  return status !== undefined;
};

const hasPriorityInBody = (requestBody) => {
  let { priority } = requestBody;
  return priority !== undefined;
};

const hasTodoInBody = (requestBody) => {
  let { todo } = requestBody;
  return todo !== undefined;
};

const hasCategoryInBody = (requestBody) => {
  let { category } = requestBody;
  return category !== undefined;
};

const hasDueDateInBody = (requestBody) => {
  let { dueDate } = requestBody;
  return dueDate !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, category, todo, dueDate } = request.body;
  switch (true) {
    case hasStatusInBody(request.body):
      // scenario 1
      if (statuses.includes(status)) {
        const updateStatusAPI5Query = `update todo set status = '${status}' where id = ${todoId};`;
        await db.run(updateStatusAPI5Query);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriorityInBody(request.body):
      if (priorities.includes(priority)) {
        const updatePriorityAPI5Query = `update todo set priority = '${priority}' where id = ${todoId};`;
        await db.run(updatePriorityAPI5Query);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasTodoInBody(request.body):
      const { todo } = request.body;
      const updateTodoAPI5Query = `update todo set todo = '${todo}' where id = ${todoId};`;
      await db.run(updateTodoAPI5Query);
      response.send("Todo Updated");
      break;
    case hasCategoryInBody(request.body):
      if (categories.includes(category)) {
        const updateCategoryAPI5Query = `update todo set category = '${category}' where id = ${todoId};`;
        await db.run(updateCategoryAPI5Query);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDueDateInBody(request.body):
      if (isValid(new Date(dueDate))) {
        const dateReq = format(new Date(dueDate), "yyyy-MM-dd");
        const updateDueDateAPI5Query = `update todo set due_date = '${dateReq}' where id = ${todoId};`;
        await db.run(updateDueDateAPI5Query);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteAPI6Query = `delete from todo where id = ${todoId};`;
  await db.run(deleteAPI6Query);
  response.send("Todo Deleted");
});
module.exports = app;
