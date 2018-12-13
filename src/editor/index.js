import Notifications, {notify} from 'react-notify-toast';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import React from 'react';

import EditorToolbar, { buttonTypes } from './editorToolbar';

const emptyDocument = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: '',
              },
            ],
          },
        ],
      },
    ],
  },
});

class RichEditor extends React.Component {
  constructor() {
    super();
    const initialValue = this.getInitialValue();
    console.log('initial value is ..', initialValue);
    this.state = {
      value: initialValue,
    };
    this.onChange = this.onChange.bind(this);
    this.handleToolbarButtonClick = this.handleToolbarButtonClick.bind(this);
  }

  getInitialValue() {
    const existingValue = JSON.parse(localStorage.getItem('editorContent'));
    const initialValue = existingValue || emptyDocument;
    return Value.fromJSON(initialValue);
  }

  onChange({ value }) {
    this.setState({ value });
  }

  saveContent() {
    const editorContent = JSON.stringify(this.state.value.toJSON());
    localStorage.setItem('editorContent', editorContent);
    notify.show('💾 saved ✔', 'success');
  }

  restoreContent() {
    const initialValue = this.getInitialValue();
    this.setState({ value: initialValue });
    notify.show('restored saved content ✔', 'success');
  }

  handleToolbarButtonClick(event, buttonDetails) {
    const buttonType = buttonDetails.buttonType;
    if (buttonType === buttonTypes.save) {
      this.saveContent();
    } else if (buttonType === buttonTypes.cancel) {
      this.restoreContent();
    }
  };

  render() {
    return (
      <div>
        <Notifications/>
        <EditorToolbar
          activeMarks={this.state.value.activeMarks}
          blocks={this.state.value.blocks}
          isSaveActive={true}
          handleClick={this.handleToolbarButtonClick}
        />

        <Editor
          spellCheck
          autoFocus
          placeholder="Enter some rich text..."
          value={this.state.value}
          onChange={this.onChange}
        />
      </div>
    )
  }

}

export default RichEditor;
