define([
    'lodash',
    'taoQtiItem/qtiItem/helper/response',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/response/responseForm',
    'taoQtiItem/qtiCreator/widgets/helpers/modalFeedbackRule'
], function(_, responseHelper, formElement, responseFormTpl, modalFeedbackRule){

    var _saveCallbacks = {
        mappingAttr : function(response, value, key){
            if(value === ''){
                response.removeMappingAttribute(key);
            }else{
                response.setMappingAttribute(key, value);
            }
        }
    };

    var answerStateHelper = {
        //forward to one of the available sub state, according to the response processing template
        forward : function(widget){

            var response = widget.element.getResponseDeclaration();
            if(responseHelper.isUsingTemplate(response, 'MATCH_CORRECT')){

                widget.changeState('correct');

            }else if(responseHelper.isUsingTemplate(response, 'MAP_RESPONSE') ||
                responseHelper.isUsingTemplate(response, 'MAP_RESPONSE_POINT')){

                widget.changeState('map');
            }
        },
        initResponseForm : function(widget){

            var interaction = widget.element,
                item = interaction.getRelatedItem(),
                rp = item.responseProcessing,
                response = interaction.getResponseDeclaration(),
                template = responseHelper.getTemplateNameFromUri(response.template),
                corrects = response.getCorrect(),
                defineCorrect = corrects && _.size(corrects),
                $correctWidgets = $();

            if(!template){
                if(rp.processingType === 'custom'){
                    template = 'CUSTOM';
                }else{
                    throw 'invalid response template';
                }
            }

            widget.$responseForm.html(responseFormTpl({
                defineCorrect : defineCorrect,
                template : template,
                templates : _getAvailableRpTemplates(interaction),
                defaultValue : response.getMappingAttribute('defaultValue'),
                lowerBound : response.getMappingAttribute('lowerBound'),
                upperBound : response.getMappingAttribute('upperBound')
            }));
            widget.$responseForm.find('select[name=template]').val(template);

            var _toggleCorrectWidgets = function(show){
                
                if(!$correctWidgets.length){
                    $correctWidgets = widget.$container.find('[data-edit=correct]');
                }

                if(show){
                    $correctWidgets.show();
                }else{
                    $correctWidgets.hide();
                }
            };
            
            _toggleCorrectWidgets(defineCorrect);
            
            formElement.initDataBinding(widget.$responseForm, response, {
                defaultValue : _saveCallbacks.mappingAttr,
                lowerBound : _saveCallbacks.mappingAttr,
                upperBound : _saveCallbacks.mappingAttr,
                template : function(response, value){

                    rp.setProcessingType('templateDriven');
                    response.setTemplate(value);
                    answerStateHelper.forward(widget);
                    answerStateHelper.initResponseForm(widget)
                },
                defineCorrect : function(response, value){
                    _toggleCorrectWidgets(value);
                }
            });

            modalFeedbackRule.initFeedbacksPanel($('.feedbackRule-panel', widget.$responseForm), response);

            formElement.initWidget(widget.$responseForm);
        },
        isCorrectDefined : function(widget){
            var response = widget.element.getResponseDeclaration();
            return !!_.size(response.getCorrect());
        }
    };

    /**
     * Get available rp templates accoding to interaction type and response processing type
     * 
     * @param {object} interaction
     * @returns {object} templates
     */
    var _getAvailableRpTemplates = function(interaction){

        var templates = {
            'CUSTOM' : 'custom',
            'MATCH_CORRECT' : 'match correct',
            'MAP_RESPONSE' : 'map response',
            'MAP_RESPONSE_POINT' : 'map response'
        },
        rp = interaction.getRelatedItem().responseProcessing;

        switch(interaction.qtiClass){
            case 'orderInteraction':
            case 'graphicOrderInteraction':
            case 'extendedTextInteraction':
                delete templates.MAP_RESPONSE;
                delete templates.MAP_RESPONSE_POINT;
                break;
            case 'selectPointInteraction':
                delete templates.MAP_RESPONSE;
                break;
            default:
                delete templates.MAP_RESPONSE_POINT;
        }

        if(interaction.qtiClass === 'selectPointInteraction'){
            delete templates.MAP_RESPONSE;
        }else{
            delete templates.MAP_RESPONSE_POINT;
        }

        if(rp.processingType === 'templateDriven'){
            delete templates.CUSTOM;
        }else{
            //consider as custom
        }

        return templates;
    };

    return answerStateHelper;
});