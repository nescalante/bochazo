angular.module("bchz").directive(
    'tagCollection', 
    ['$timeout', function ($timeout) {
        'use strict';

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var input = element.find('input.tag-input');

                if (!attrs.tagCollectionModel) {
                    throw 'tagCollectionModel parameter is required';
                }

                element.bind('click', function() {
                    $timeout(function() {
                        input.focus();
                    });
                });

                // styling events
                input
                .bind('focus', function() {
                    element.addClass('focused');
                })
                .bind('blur', function() {
                    element.removeClass('focused');
                });

                scope.$watchCollection(attrs.tagCollectionModel, function () {
                    if (scope[attrs.tagCollectionModel] && scope[attrs.tagCollectionModel].length > 0) {
                        element.removeClass('has-no-tags');
                    }
                    else {
                        element.addClass('has-no-tags');
                    }
                });

                input
                .bind("keydown keyup keypress blur", function (event) {
                        // validate input
                        if(event.type == 'keyup') {
                            validateTag(input, input.val(), scope[attrs.tagCollectionModel]);
                        }

                        // add tag logic on enter or comma
                        if(event.type == 'blur' || event.which === 13 || event.which === 44) {
                            scope.$apply(function () {
                                if (attrs.tagInput) {
                                    scope[attrs.tagInput] = addTag(scope[attrs.tagInput], scope[attrs.tagCollectionModel]);
                                }
                                else {
                                    input.val(addTag(input.val(), scope[attrs.tagCollectionModel]));
                                }
                            });

                            event.preventDefault();
                        }
                    });

                // remove tag logic
                scope.$on('tag.remove', function (event, tag, parent) {
                    if (!parent || parent === scope[attrs.tagCollectionModel]) {
                        scope.$apply(function () {
                            scope[attrs.tagCollectionModel] = removeTag(tag, scope[attrs.tagCollectionModel]);
                        });
                    }
                });

                function addTag(tag, target) {
                    var tags,
                    invalidTags = [];

                    if (tag) {
                        tags = tag.split(',');

                        for (var i = 0; i < tags.length; i++) {
                            var currentTag = tags[i].trim().toLowerCase();

                            if (isValidTag(currentTag, target) && currentTag != '') {
                                target.push(currentTag);
                            }
                            else if (currentTag != '') {
                                invalidTags.push(currentTag);
                            }
                        }

                        tag = invalidTags.join(', ');
                    }

                    return tag;
                }

                function removeTag(tag, target) {
                    if (target) {
                        target = va(target).where(function (t) { return t != tag });
                    }

                    return target;
                }

                function isValidTag(tag, target) {
                    if (target) {
                        return !va(target)
                        .select(function (t) { return t.toLowerCase(); })
                        .contains(tag && tag.toLowerCase());
                    }
                    else {
                        return false;
                    }
                }

                function validateTag(input, tag, target) {
                    if (isValidTag(tag, target)) {
                        input.removeClass('text-danger');
                    }
                    else {
                        input.addClass('text-danger');
                    }
                }
            }
        };
    }]);