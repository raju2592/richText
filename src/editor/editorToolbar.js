import React from 'react';
import { Button, Icon, Toolbar } from './components';

const EditorButton = (props) => {
  const {handleClick, isActive, buttonDetails, icon} = props;
  const buttonProps = { active: isActive };
  if (handleClick) buttonProps.onMouseDown = (event) => handleClick(event, buttonDetails);
  return (
    <Button {...buttonProps}>
      <Icon>{icon}</Icon>
    </Button>
  );
};

const markButtons = [
  ['bold', 'format_bold'],
  ['italic', 'format_italic'],
  ['underlined', 'format_underlined'],
  ['code', 'code'],
];

const blockButtons = [
  ['heading-one', 'looks_one'],
  ['heading-two', 'looks_two'],
  ['block-quote', 'format_quote'],
  ['numbered-list', 'format_list_numbered'],
  ['bulleted-list', 'format_list_bulleted'],
];

export const buttonTypes = {
  mark: 'mark',
  block: 'block',
  imageLink: 'imageLink',
  imageUpload: 'imageUpload',
  save: 'save',
  cancel: 'cancel',
};

const EditorToolbar = (props) => {
  const { handleClick, activeMarks, blocks, isSaveActive } = props;
  
  const saveButtonProps = {
    handleClick: isSaveActive ? handleClick : null,
    isActive: isSaveActive,
    buttonDetails: { buttonType: buttonTypes.save },
    icon: 'save',
  };

  const cancelButtonProps = {
    handleClick,
    isActive: true,
    buttonDetails: { buttonType: buttonTypes.cancel },
    icon: 'cancel',
  };

  const imageLinkButtonProps = {
    handleClick,
    isActive: true,
    buttonDetails: { buttonType: buttonTypes.imageLink },
    icon: 'image',
  };

  const imageUploadButtonProps = {
    handleClick,
    isActive: true,
    buttonDetails: { buttonType: buttonTypes.imageUpload },
    icon: 'collections',
  };

  return (
    <Toolbar>
      {markButtons.map(([type, icon]) => {
        const isActive = activeMarks.some((mark) => mark.type === type);
        const buttonProps = {
          buttonDetails: { buttonType: buttonTypes.mark, markType: type },
          isActive,
          icon,
          handleClick,
        };
        return (
          <EditorButton {...buttonProps} key={`${type}`}/>
        );
      })}

      {blockButtons.map(([type, icon]) => {
        const isActive = blocks.some((node) => node.type === type);
        const buttonProps = {
          buttonDetails: { buttonType: buttonTypes.block, blockType: type },
          isActive,
          icon,
          handleClick,
        };
        return (
          <EditorButton {...buttonProps} key={`${type}`}/>
        );
      })}

      <EditorButton {...imageLinkButtonProps}/>
      <EditorButton {...imageUploadButtonProps}/>
      <EditorButton {...saveButtonProps}/>
      <EditorButton {...cancelButtonProps}/>
    </Toolbar>
  );
};

export default EditorToolbar;
