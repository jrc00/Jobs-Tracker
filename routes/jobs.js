var express = require('express');
var router = express.Router();
var Job = require('../models/job');
var User = require('../models/user');
var apikey = process.env.INDEED_KEY;
var api = require('indeed-api').getInstance(apikey);

var authenticate = function(req, res, next) {
  if(!req.isAuthenticated()) {
    res.redirect('/');
  }
  else {
    next();
  }
};
// INDEX
router.get('/', authenticate, function(req, res, next) {
  var jobs = global.currentUser.jobs;
  var states = ['Georgia', 'Washington DC', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Kentucky', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusets', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska' ,'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
  res.render('jobs/index', { jobs: jobs, states: states, message: req.flash() });
});

// NEW
router.get('/new', authenticate, function(req, res, next) {
  var job = {
  title: '',
  company: '',
  city: '',
  state: '',
  country: '',
  postDate: '',
  description: '',
  applyUrl: '',
  jobkey: '',
  applied: false,
  followUp: false
  };
  res.render('jobs/new', { job: job, message: req.flash() });
});

//SEARCH
router.post('/search', authenticate, function(req, res, next) {
  var currentUser = req.user;
  var keywords = [req.body.keywords];
  var city = req.body.city;
  var state = req.body.state;
  var radius = req.body.radius;
  var limit = req.body.limit;
  if (keywords.length > 0) {
  api.JobSearch()
  .Radius(radius)
  .WhereKeywords(keywords)
  .WhereLocation({
    city: city,
    state: state
  })
  .Limit(limit)
  .SortBy("date")
  .UserIP("1.2.3.4")
  .UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
  .Search(function (results) {
    res.render('jobs/search', { jobs: results.results, message: req.flash() });
    // console.log(results.results[0].jobkey);
  },
    function (error) {

    console.log(error);
  });
  }
  else {
  api.JobSearch()
  .Radius(radius)
  .WhereLocation({
    city: city,
    state: state
  })
  .Limit(limit)
  .SortBy("date")
  .UserIP("1.2.3.4")
  .UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
  .Search(function (results) {
    res.render('jobs/search', { jobs: results.results, message: req.flash() });
    // console.log(results.results[0].jobkey);
  },
    function (error) {

    console.log(error);
  });
  };
});

//ADD
router.post('/add', authenticate, function(req, res, next) {
  jobkeys = [req.body.add];
  var currentUser = req.user;
  api.GetJob().WhereJobKeys(jobkeys).Retrieve(
  function (results) {
    var add = results.results[0];
    var job = {
      title: add.jobtitle,
      company: add.company,
      city: add.city,
      state: add.state,
      country: add.country,
      postDate: add.date,
      description: add.snippet,
      applyUrl: add.url,
      jobkey: add.jobkey,
      applied: false,
      followUp: false
    };
    array = [];
    var matchstat = false
    array.push(currentUser.jobs);
    if (array.length > 0) {
      for (i = 0; i < array.length; i++) {
        var matches = array[i];
        for (j = 0; j < matches.length; j++) {
          var match = matches[j];
          if (match) {
            if (match.jobkey == job.jobkey) {
              matchstat = true
            };
          };
        };
      };
    };
    if (matchstat == false) {
    currentUser.jobs.push(job);
    currentUser.save()
    .then(function() {
      res.redirect('/jobs');
    }, function(err) {
      return next(err);
    });
    }
    else {
      var jobs = currentUser.jobs;
      var states = ['Washington DC', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Georgia', 'Kentucky', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusets', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska' ,'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming']
      res.render('jobs/index', { jobs: jobs, states: states, message: req.flash() });
    };
  },
  function (error) {
    // do something with the error results
    console.log(error);
  });
});

// SHOW
router.get('/:id', authenticate, function(req, res, next) {
  var job = currentUser.jobs.id(req.params.id);
  if (!job) return next(makeError(res, 'Document not found', 404));
  res.render('jobs/show', { job: job, message: req.flash() } );
});

// CREATE
router.post('/', authenticate, function(req, res, next) {
  var job = {
  title: req.body.title,
  company: req.body.company,
  city: req.body.city,
  state: req.body.state,
  country: req.body.country,
  postDate: req.body.postDate,
  description: req.body.description,
  applyUrl: req.body.applyUrl,
  jobkey: req.body.jobkey,
  applied: req.body.applied,
  followUp: req.body.followUp
  };
  // Since a user's jobs are an embedded document, we just need to push a new
  // JOB to the user's list of jobs and save the user.
  currentUser.jobs.push(job);
  currentUser.save()
  .then(function() {
    res.redirect('/jobs');
  }, function(err) {
    return next(err);
  });
});

// EDIT
router.get('/:id/edit', authenticate, function(req, res, next) {
  var job = currentUser.jobs.id(req.params.id);
  if (!job) return next(makeError(res, 'Document not found', 404));
  res.render('jobs/edit', { job: job, message: req.flash() } );
});

// UPDATE
router.put('/:id', authenticate, function(req, res, next) {
  var job = currentUser.jobs.id(req.params.id);
  if (!job) return next(makeError(res, 'Document not found', 404));
  else {
    job.title = req.body.title,
    job.company = req.body.company,
    job.city = req.body.city,
    job.state = req.body.state,
    job.country = req.body.country,
    job.postDate = req.body.postDate,
    job.description = req.body.description,
    job.applyUrl = req.body.applyUrl,
    job.jobkey = req.body.jobkey,
    job.applied = req.body.applied,
    job.followUp = req.body.followUp
    currentUser.save()
    .then(function(saved) {
      res.redirect('/jobs');
    }, function(err) {
      return next(err);
    });
  }
});

// DESTROY
router.delete('/:id', authenticate, function(req, res, next) {
  var job = currentUser.jobs.id(req.params.id);
  if (!job) return next(makeError(res, 'Document not found', 404));
  var index = currentUser.jobs.indexOf(job);
  currentUser.jobs.splice(index, 1);
  currentUser.save()
  .then(function(saved) {
    res.redirect('/jobs');
  }, function(err) {
    return next(err);
  });
});

module.exports = router;
