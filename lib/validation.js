const Joi = require('joi')
const Boom = require('boom')
const escape = require('escape-string-regexp')

// https://stackoverflow.com/questions/41585392/what-are-the-rules-for-index-names-in-elastic-search#41585755
const maxIndexSize = 255
exports.indexName = Joi
  .string()
  .trim()
  .lowercase()
  .regex(/[#\\/*?"<>|]/, {invert: true, name: 'contain #, \\, /, *, ?, ", <, >, or |'})
  .regex(/^[_\-+]/, {invert: true, name: 'start with _, - or +'})
  .not(['.', '..'])
  .min(1)
  .max(maxIndexSize, 'utf8')
  .required()
  .label('index name')

const indexSuffixSize = 25 // ( '-' + max of the iso data size)
const maxIndexWithoutSuffixSize = maxIndexSize - indexSuffixSize
exports.indexNameWithoutSuffix = exports.indexName.max(maxIndexWithoutSuffixSize, 'utf8').label('name')

exports.indexTemplateStructure = Joi.object()
  .keys({
    index_patterns: Joi.array()
      .min(1)
      .items(Joi.string().regex(new RegExp(`-*$`)).allow('*'))
      .single(), // indexTemplate(name) will take care of the default later
    settings: Joi.object().unknown(true),
    mappings: Joi.object().unknown(true)
  })
  .unknown(true)
  .empty(Joi.object().length(0))
  .label('index template')

exports.indexTemplate = name => Joi.object()
  .keys({
    index_patterns: Joi.array()
      .min(1)
      .items(Joi.string().regex(new RegExp(`^${escape(`${name}-*`)}$`)).allow('*'))
      .single()
      .default([`${name.trim().toLowerCase()}-*`]),
    settings: Joi.object().unknown(true),
    mappings: Joi.object().unknown(true)
  })
  .unknown(true)
  .empty(Joi.object().length(0))
  .label('index template')

exports.validate = (...params) => {
  try {
    return Joi.attempt(...params)
  } catch (error) {
    throw Boom.boomify(error, {statusCode: 400})
  }
}
