



'use strict';

const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    date: {
      type    : String, // YYYY-MM-DD
      required: true,
      unique  : true,
    },
    count: {
      type   : Number,
      default: 0,
    },
    uniqueIPs: {
      type   : [String],
      default: [],
      select : false, // don't return IPs by default
    },
    pageViews: {
      type   : Map,
      of     : Number,
      default: {},
    },
  },
  { timestamps: true }
);

visitorSchema.index({ date: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);