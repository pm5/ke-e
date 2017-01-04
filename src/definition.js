/**
 * @module
 */
import assert from 'assert';
import _ from 'lodash';
import {Arbitrary} from './arbitrary';
import avaliableLocaleIds from './types/locale/avaliableLocaleids.js';
import {elements, regex} from './combinators';

/**
 * Extra definitons manager.
 *
 * const data = {en: {name1: val1}, zh_Hant_TW: {name1: val1}}
 * const defs = new Definitions(data);
 * // make a arbitrary.
 * defs.arbitrary('fisrtName')
 * // make a formater.
 * defs.formater('name')
 */
class Definitions{
  /**
   * @param {Object} data
   *
   * the structure of data looks like
   * {en: {name1: val1}, zh_Hant_TW: {name1: val1}}
   *
   */
  constructor(data) {
    this._data = data;
  }
  /**
   * Get a definition.
   *
   * a definition is an array of any values or regular expression.
   *
   * @param {string} name a definition name.
   * @param {string} locale a locale tag. default is `en`.
   * @return {*}
   */
  get(name, locale = 'en') {
    if (avaliableLocaleIds.indexOf(locale) < 0) {
      throw new Error(`Locale ${locale} is not supported`);
    }
    const _locale = locale.replace(/-/g, '_');
    const _def = this._data[_locale] || this._data['en'];
    return _.get(_def, name);
  }
  /**
   * Creates a arbitrary from a definition.
   *
   * @param {string} name
   * @return {Arbitrary}
   */
  arbitrary(name) {
    return new Arbitrary({
      gen: (pool) => {
        return (engine, locale) => {
          let _pool = pool ? pool : this.get(name, locale);
          assert(_pool !== undefined, `definition ${name} in ${locale} is empty.`);
          _pool = _pool.map(s => {
            return _.isRegExp(s) ? regex(s).makeGen()(engine) : s
          });
          return elements(_pool).makeGen()(engine, locale);
        }
      }
    });
  }
  /**
   * Create a special arbitrary transform function for formating
   * the result generated by a arbitrary.
   *
   * @param {string} name
   * @return {function}
   */
  formater(name) {
    const self = this;
    return function (result, locale, engine) {
      let f = self.get(name, locale);
      if (_.isArray(f)) {
        f = _.template(elements(f).makeGen()(engine));
      }
      return f(result);
    };
  }
}

export {
  Definitions
}
