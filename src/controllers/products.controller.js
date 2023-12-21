const { Router } = require("express");
const router = Router();
const ProductManager = require("../services/ProductsManager");

let productManager;

// Función para manejar errores y enviar una respuesta con un código de estado 500
const errorHandler = (err, res) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};

// Inicialización del ProductManager y definición de rutas
(async () => {
  productManager = await new ProductManager("controllers/products.json");

  // Obtener todos los productos y renderizar la vista home.handlebars
  router.get("/", async (req, res) => {
    try {
      await productManager.loadProducts();
      const limit = req.query.limit;
      console.log("Cargando productos");
      const products = limit
        ? productManager.getProducts().slice(0, limit)
        : productManager.getProducts();
      res.render("home.handlebars", { products });
    } catch (err) {
      errorHandler(err, res);
    }
  });

  // Obtener todos los productos y renderizar la vista realtimeproducts.handlebars
  router.get("/realtimeproducts", async (req, res) => {
    try {
      await productManager.loadProducts();
      const limit = req.query.limit;
      console.log("Cargando productos");
      const products = limit
        ? productManager.getProducts().slice(0, limit)
        : productManager.getProducts();
      res.render("realtimeproducts.handlebars", { products });
    } catch (err) {
      errorHandler(err, res);
    }
  });

  // Obtener un producto por su ID
  router.get("/:pid", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      await productManager.loadProducts();
      const product = productManager.getProductById(pid);
      if (product) {
        res.json({ product });
      } else {
        res.status(404).json({ error: "Producto no encontrado" });
      }
    } catch (err) {
      errorHandler(err, res);
    }
  });

  // Agregar un nuevo producto
  router.post("/", async (req, res) => {
    try {
      const { title, description, price, thumbnail, code, stock, status } =
        req.body;
      if (
        !title ||
        !description ||
        !price ||
        !thumbnail ||
        !code ||
        !stock ||
        !status
      ) {
        throw new Error("Todos los campos son obligatorios");
      }

      await productManager.addProduct(
        title,
        description,
        price,
        thumbnail,
        code,
        stock,
        status
      );
      res.json({ message: "Producto agregado con éxito" });
    } catch (err) {
      console.error("Error:", err);
      errorHandler(err, res);
    }
  });

  // Actualizar un producto por su ID
  router.put("/:pid", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      await productManager.loadProducts();
      const updatedFields = req.body;
      const update = await productManager.updateProduct(pid, updatedFields);

      if (!update) {
        console.log(update);
        return res.status(404).json({
          message: "Producto no encontrado",
        });
      }

      res.json({ message: `Producto con ID ${pid} actualizado con éxito` });
    } catch (err) {
      errorHandler(err, res);
    }
  });

  // Eliminar un producto por su ID
  router.delete("/:pid", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      await productManager.loadProducts();
      const deleted = (await productManager.deleteProduct(pid)) ? true : false;

      if (!deleted) {
        console.log(deleted);
        return res.status(404).json({
          message: "Producto no encontrado",
        });
      }

      res.json({
        message: `Producto con ID ${pid} eliminado con éxito`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error al eliminar producto",
      });
    }
  });

  // Agregar un nuevo producto en tiempo real
  router.post("/realtimeproducts", async (req, res) => {
    try {
      const { title, description, price, thumbnail, code, stock, status } =
        req.body;
      if (
        !title ||
        !description ||
        !price ||
        !thumbnail ||
        !code ||
        !stock ||
        !status
      ) {
        throw new Error("Todos los campos son obligatorios");
      }

      await productManager.addProduct(
        title,
        description,
        price,
        thumbnail,
        code,
        stock,
        status
      );

      const product = req.body;
      console.log(product);

      const { io } = require("../app.js");
      io.emit("addProduct", product);

      res.json({ message: "Producto agregado con éxito" });
    } catch (err) {
      console.error("Error:", err);
      errorHandler(err, res);
    }
  });

  // Eliminar un producto en tiempo real por su ID
  router.delete("/realtimeproducts/:pid", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      await productManager.loadProducts();
      const deletedProduct = productManager.getProductById(pid);
      const deleted = (await productManager.deleteProduct(pid)) ? true : false;

      if (!deleted) {
        console.log(deleted);
        return res.status(404).json({
          message: "Producto no encontrado",
        });
      }

      const { io } = require("../app");
      console.log("Antes de emitir 'updateProducts'");
      io.emit("updateProducts", { deleted: true, _id: pid });
      console.log("Después de emitir 'updateProducts'");

      res.json({
        message: `Producto con ID ${pid} eliminado con éxito`,
        product: deletedProduct,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error al eliminar producto",
      });
    }
  });
})();

module.exports = router;
