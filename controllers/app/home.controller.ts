import { errRes, okRes, paginate } from "../../helpers/tools";
import { Category } from "../../src/entity/Category";
import { Invoice } from "../../src/entity/Invoice";
import { Method } from "../../src/entity/Method";
import { Product } from "../../src/entity/Product";

/**
 *
 */
export default class HomeController {
  /**
   *
   * @param req
   * @param res
   */
  static async getCategories(req, res): Promise<object> {
    let { p, s } = req.query;
    let { skip, take } = paginate(p, s);

    try {
      let data = await Category.findAndCount({
        where: { active: true },
        relations: ["products"],
        take,
        skip,
        order: { id: "ASC" },
      });
      return okRes(res, { data });
    } catch (error) {
      return errRes(res, error);
    }
  }

  /**
   *
   * @param req
   * @param res
   */
  static async getProducts(req, res): Promise<object> {
    let { p, s } = req.query;
    let { skip, take } = paginate(p, s);

    let category = req.params.category;
    const active = true;
    try {
      let data = await Product.find({
        where: { active, category },
        relations: ["category"],
        take,
        skip,
      });
      return okRes(res, { data });
    } catch (error) {
      return errRes(res, error);
    }
  }

  /**
   *
   * @param req
   * @param res
   */
  static async getMethods(req, res): Promise<object> {
    try {
      let data = await Method.find({
        where: { active: true },
      });
      return okRes(res, { data });
    } catch (error) {
      return errRes(res, error);
    }
  }

  /**
   *
   * @param req
   * @param res
   */
  static async getInvoices(req, res): Promise<object> {
    try {
      let data = await Invoice.find({
        where: { user: req.user },

        join: {
          alias: "invoice",
          leftJoinAndSelect: {
            user: "invoice.user",
            items: "invoice.items",
            product: "items.product",
          },
        },
      });
      return okRes(res, { data });
    } catch (error) {
      return errRes(res, error);
    }
  }
}
