import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImageCard } from '../../src/presentation/components/ImageCard';
import { makeImage } from '../fixtures/imageFixtures';

describe('ImageCard', () => {
  it('renders and forwards press events', () => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();
    const image = makeImage();

    const { getByLabelText } = render(
      <ImageCard image={image} size={100} onPress={onPress} onToggleFavorite={onToggleFavorite} />
    );

    fireEvent.press(getByLabelText(image.description));
    expect(onPress).toHaveBeenCalledWith(image);

    fireEvent.press(getByLabelText('Add to favorites'));
    expect(onToggleFavorite).toHaveBeenCalledWith(image.id);
  });

  it('shows the correct accessibility label when already a favorite', () => {
    const image = makeImage({ isFavorite: true });
    const { getByLabelText } = render(
      <ImageCard image={image} size={100} onPress={jest.fn()} onToggleFavorite={jest.fn()} />
    );
    expect(getByLabelText('Remove from favorites')).toBeTruthy();
  });
});
