Handlebars.registerHelper('session', function (input) {
  return Session.get(input);
});

Handlebars.registerHelper('loggedIn', function () {
  return Meteor.user() != null;
});

Handlebars.registerHelper('breaklines', function (text) {
  text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
  return new Handlebars.SafeString(text);
});

Handlebars.registerHelper('formatDate', function (datetime, format) {
  if (moment) {
    return moment(datetime).format(format);
  }
  else {
    return datetime;
  }
});

Handlebars.registerHelper('pluralize', function(n, thing) {
  if (n === 1) {
    return '1 ' + thing;
  } else {
    return n + ' ' + thing + 's';
  }
});

Handlebars.registerHelper('empty', function (entity) {
  if (typeof entity === "string" || typeof entity === "object") {
    return entity.length == 0;
  } else {
    return null;
  }
});

Handlebars.registerHelper('selected', function (obj1, obj2) {
  return obj1 == obj2 ? "selected" : "";
});

Handlebars.registerHelper('upcase', function (str) {
  return str.toUpperCase();
});