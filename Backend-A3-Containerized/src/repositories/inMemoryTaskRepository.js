// In-memory implementation of the Task repository interface.
// Kept from earlier assignments to prove the interface is storage-agnostic:
// the routes call these exact methods no matter which repository is active.
//
// Interface (all async so it matches the Postgres repository):
//   findAll()                -> Task[]
//   findById(id)             -> Task | null
//   create({ title, done })  -> Task
//   update(id, { title, done }) -> Task | null
//   remove(id)               -> boolean (true if a row was deleted)

module.exports = function createInMemoryTaskRepository() {
  let tasks = [
    { id: 1, title: "Buy milk", done: false },
    { id: 2, title: "Read a chapter of a book", done: false },
    { id: 3, title: "Go for a walk", done: true },
  ];
  let nextId = 4;

  return {
    async findAll() {
      return tasks.map((t) => ({ ...t }));
    },
    async findById(id) {
      const t = tasks.find((t) => t.id === id);
      return t ? { ...t } : null;
    },
    async create({ title, done }) {
      const task = { id: nextId++, title, done: Boolean(done) };
      tasks.push(task);
      return { ...task };
    },
    async update(id, { title, done }) {
      const t = tasks.find((t) => t.id === id);
      if (!t) return null;
      if (title !== undefined) t.title = title;
      if (done !== undefined) t.done = Boolean(done);
      return { ...t };
    },
    async remove(id) {
      const before = tasks.length;
      tasks = tasks.filter((t) => t.id !== id);
      return tasks.length < before;
    },
  };
};
