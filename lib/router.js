var seoData = {
  admin: {
    title: "Admin",
    description: "Change administrative settings."
  },
  userEdit: {
    title: "Profile",
    description: "Edit profile information."
  },
  postSubmit: {
    title: "Submit Petition",
    description: "Submit a petition to PawPrints."
  },
  postsList: {
    title: "Petitions",
    description: "PawPrints is a place for sparking change at RIT. Share ideas with the RIT community and influence decision making."
  },
  postsResponses: {
    title: "Responses",
    description: "View petitions that have received responses from RIT Student Government and Administration."
  },
  postPage: {
    title: "View Petition",
    description: "View petition on PawPrints."
  },
  postEdit: {
    title: "Edit Petition",
    description: "Edit petition."
  },
  about: {
    title: "About PawPrints",
    description: "Learn more about the history of PawPrints, its goal and vision."
  },
  api: {
    title: "API Access",
    description: "Student Government provides a read-only JSON REST API for retreiving petition information."
  },
  moderation: {
    title: "Moderation Policy",
    description: "PawPrints follows the RIT Code of Conduct for Computer and Network Use."
  },
  petitionProcess: {
    title: "Petition Process",
    description: "Learn how to effectively create a successful petition."
  },
  index: {
    title: "PawPrints",
    description: "PawPrints is a place for sparking change at RIT. Share ideas with the RIT community and influence decision making."
  },
  pageNotFound: {
    title: "Page Not Found",
    description: "The page you requested is not found."
  }
};

Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  onBeforeAction: function () {
    var page = this.route.name;
    setSEO(seoData[page]);
  },
  onRun: function () {
    Deps.nonreactive(function() {
      GAnalytics.pageview();
    });
  },
  waitOn: function () {
    return [Meteor.subscribe('singleton')];
  },
  onAfterAction: function () {
    if (Errors.find().fetch().length > 0) {
      $('#errorModal').modal('show');
    }
  }
});

SingletonController = RouteController.extend({
  data: function() {
    return {
      singleton: Singleton.findOne()
    };
  }
});

var infiniteScroll = function() {
  var didScroll = false,
      windowDom = $(window),
      documentDom = $(document)
      bufferBottom = 125;

  if (windowDom.width() <= 400) {
    bufferBottom = windowDom.height() * 0.75;
  }

  $(window).scroll(function() {
      didScroll = true;
  });

  setInterval(function() {
    if ( didScroll ) {
      didScroll = false;
      var atBottom = (windowDom.scrollTop() >= documentDom.height() - windowDom.height() - bufferBottom);
      if (atBottom) {
        Session.set('postsLimit', Session.get('postsLimit') + 12);
      }
    }
  }, 500);
};

PostsListController = RouteController.extend({
  onBeforeAction: function() {
    Meteor.subscribe('posts', Session.get('postsLimit'), Session.get('postOrder'));
    infiniteScroll();
  },
  data: function() {
    var sort = {};
    sort[Session.get('postOrder')] = -1;
    return {
      posts: Posts.find({}, {sort: sort}).fetch(),
      singleton: Singleton.findOne(),
      postOrder: Session.get('postOrder')
    };
  },
});

PostsWithResponsesController = RouteController.extend({
  onBeforeAction: function () {
    Meteor.subscribe('postsWithResponses', Session.get('postsLimit'));
    infiniteScroll();
  },
  data: function() {
    var sort = {};
    sort[Session.get('postOrder')] = -1;
    return {
      posts: Posts.find({}, {sort: sort}).fetch(),
      singleton: Singleton.findOne(),
      postOrder: Session.get('postOrder')
    };
  }
});

Router.map(function() {

  // Privileged Routes

  this.route('admin', {
    path: '/admin',
    template: 'admin',
    waitOn: function() {
      return [Meteor.subscribe('privilegedUsers')];
    },
    data: function() {
      return {
        admins: Meteor.users.find({roles: {$in: ['admin']}}),
        moderators: Meteor.users.find({roles: {$in: ['moderator']}}),
        notifiers: Meteor.users.find({roles: {$in: ['notify-threshold-reached']}}),
        singleton: Singleton.findOne()
      };
    }
  });

  // User Routes

  this.route('userEdit', {
    path: '/users/edit',
    waitOn: function() {
      return [Meteor.subscribe('apiKeys')]; 
    },
    data: function() {
      return {
        user: Meteor.user(),
        apiKeys: ApiKeys.findOne(),
        singleton: Singleton.findOne()
      };
    }
  });

  // Post Routes

  this.route('postSubmit', {
    path: '/petitions/create',
    controller: SingletonController
  });

  this.route('postsList', {
    path: '/petitions/list',
    template: 'postsList',
    controller: PostsListController
  });

  this.route('postsResponses', {
    path: '/petitions/responses',
    template: 'postsWithResponsesList',
    controller: PostsWithResponsesController
  });

  this.route('postPage', {
    path: '/petitions/:_id',
    template: 'postPage',
    waitOn: function() {
      return [Meteor.subscribe('singlePost', this.params._id),
              Meteor.subscribe('signers', this.params._id),
              Meteor.subscribe('updates', this.params._id)];
    },
    data: function() {
      return {
        post: Posts.findOne(),
        updates: Updates.find({}, {sort: {created_at: 1}}).fetch(),
        singleton: Singleton.findOne(),
        scores: Scores.find().fetch(),
        url: window.location.href
      }
    },
    onAfterAction: function() {
      if (this.data().post)
        setSEO({title: this.data().post.title, description: this.data().post.description});
      return; 
    }
  });

  this.route('postEdit', {
    path: '/petitions/:_id/edit',
    template: 'postEdit',
    onBeforeAction: function () {
      if (Meteor.user() && !_.contains(Meteor.user().roles, "moderator") && !_.contains(Meteor.user().roles, "admin"))
        this.render('pageNotFound');
    },
    waitOn: function () {
      return [Meteor.subscribe('singlePost', this.params._id),
              Meteor.subscribe('updates', this.params._id)];
    },
    data: function() {
      var post = Posts.findOne(this.params._id);
      if (this.ready() && !post)
        this.render('pageNotFound');
      else
        return {
          post: Posts.findOne(this.params._id),
          updates: Updates.find({}, {sort: {created_at: 1}}).fetch(),
          newUpdate: {},
          singleton: Singleton.findOne(),
          user: Meteor.user()
        }
    }
  });

  // Static routes

  this.route('about', {
    path: '/about',
    template: 'aboutTemplate',
    data: function () {
      return {
        singleton: Singleton.findOne(),
        subtemplate: 'about'
      };
    }
  });

  this.route('api', {
    path: '/api-access',
    template: 'aboutTemplate',
    data: function () {
      return {
        singleton: Singleton.findOne(),
        subtemplate: 'api'
      };
    }
  });

  this.route('moderation', {
    path: '/moderation',
    template: 'aboutTemplate',
    data: function () {
      return {
        singleton: Singleton.findOne(),
        subtemplate: 'moderation'
      };
    }
  });

  this.route('petitionProcess', {
    path: '/petition-process',
    template: 'aboutTemplate',
    data: function () {
      return {
        singleton: Singleton.findOne(),
        subtemplate: 'petitionProcess'
      };
    }
  });

  // Must be last route (catch-all)

  this.route('index', {
    path: '/',
    template: 'index',
    controller: PostsListController
  });

  this.route('pageNotFound', {
    path: '/*',
    onRun: function () {
      this.render('pageNotFound');
    }
  });


});

var requireLogin = function(pause) {
  if (! Meteor.user()) {
    if (Meteor.loggingIn())
      this.render(this.loadingTemplate);
    else
      this.render('accessDenied');
    pause();
  }
};

var setSEO = function(data) {
  if (Meteor.isClient) {
    var image_url;
    if( Meteor.settings && Meteor.settings.public !== undefined &&
        Meteor.settings.public.root_url !== undefined) {
      image_url = Meteor.settings.public.root_url + '/logo_200x200.png';
    }
    SEO.set({
      title: data.title,
      meta: {
        'description': data.description
      },
      og: {
        'title': data.title,
        'description': data.description,
        'image': image_url
      }
    });
  }
};

var clearLoginMsg = function() {
  Session.set("loginMsg", "");
}

Router.onBeforeAction('loading');
Router.onAfterAction(clearLoginMsg);
Router.onBeforeAction(requireLogin, {only: ['admin', 'postSubmit', 'userEdit', 'postEdit']});
