define([
    'jquery',
    'lodash',
    'i18n',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/static/states/Active',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/static/include',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/helper/creatorRenderer',
    'taoQtiItem/qtiCreator/helper/commonRenderer',
    'taoQtiItem/qtiItem/helper/xincludeLoader',
    'ui/resourcemgr'
], function($, _, __, stateFactory, Active, formTpl, formElement, creatorRenderer, commonRenderer, xincludeLoader){

    var IncludeStateActive = stateFactory.extend(Active, function(){

        this.initForm();

    }, function(){

        this.widget.$form.empty();
    });

    IncludeStateActive.prototype.initForm = function(){

        var _widget = this.widget,
            $original = _widget.$original,
            $form = _widget.$form,
            include = _widget.element,
            baseUrl = _widget.options.baseUrl;

        $form.html(formTpl({
            baseUrl : baseUrl || '',
            href : include.attr('href')
        }));

        //init slider and set align value before ...
        _initUpload(_widget);

        //... init standard ui widget
        formElement.initWidget($form);

        //init data change callbacks
        formElement.setChangeCallbacks($form, include, {
            href : _.throttle(function(include, value){

                console.log('@todo', 'disable the input field');

                include.attr('href', value);

            }, 100)
        });

    };

    var _initUpload = function(widget){

        var $form = widget.$form,
            options = widget.options,
            xinclude = widget.element,
            $container = widget.$container,
            $uploadTrigger = $form.find('[data-role="upload-trigger"]'),
            $href = $form.find('input[name=href]');

        var _openResourceMgr = function(){
            $uploadTrigger.resourcemgr({
                title : __('Please select a shared stimulus file from the resource manager. You can add files from your computer with the button "Add file(s)".'),
                appendContainer : options.mediaManager.appendContainer,
                mediaSourcesUrl : options.mediaManager.mediaSourcesUrl,
                browseUrl : options.mediaManager.browseUrl,
                uploadUrl : options.mediaManager.uploadUrl,
                deleteUrl : options.mediaManager.deleteUrl,
                downloadUrl : options.mediaManager.downloadUrl,
                fileExistsUrl : options.mediaManager.fileExistsUrl,
                params : {
                    uri : options.uri,
                    lang : options.lang,
                    filters : 'application/xml,text/xml'
                },
                pathParam : 'path',
                select : function(e, files){

                    var file;

                    if(files && files.length){

                        file = files[0].file;


                        xinclude.attr('href', file);

                        xincludeLoader.load(xinclude, options.baseUrl, function(xi, data, loadedClasses){
                            creatorRenderer.get().load(function(){

                                //set commonRenderer to the composing elements only (because xinclude is "read-only")
                                var composingElements = xinclude.getComposingElements();
                                _.each(composingElements, function(elt){
                                    elt.setRenderer(commonRenderer.get());
                                });

                                widget.refresh();

                            }, loadedClasses);
                        });

                        _.defer(function(){
                            $href.val(file).trigger('change');
                        });
                    }
                },
                open : function(){
                    //hide tooltip if displayed
                    if($href.hasClass('tooltipstered')){
                        $href.blur().tooltipster('hide');
                    }
                },
                close : function(){
                    //triggers validation : 
                    $href.blur();
                }
            });
        };

        $uploadTrigger.on('click', _openResourceMgr);

        //if empty, open file manager immediately
        if(!$href.val()){
            _openResourceMgr();
        }

    };

    return IncludeStateActive;
});
