import { Editor } from 'slate-react';
import { Value } from 'slate';
import React from 'react';
import EditorToolbar, { buttonTypes } from './editorToolbar';

const initialValue = Value.fromJSON({
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
    this.state = {
      value: initialValue,
    }
    this.onChange = this.onChange.bind(this);
    this.handleToolbarButtonClick = this.handleToolbarButtonClick.bind(this);
  }

  onChange({ value }) {
    this.setState({ value });
  }

  handleToolbarButtonClick(event, buttonDetails) {
    console.log('toolbar button clicked', buttonDetails);
  };

  render() {
    return (
      <div>
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
