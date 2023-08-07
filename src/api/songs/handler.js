const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);

    const songId = await this._service.addSong(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Song added successfully',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const { title, performer } = request.query;
    const songs = await this._service.getSongs(title, performer);
    return {
      status: 'success',
      message: 'Successfully obtained songs',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);
    const response = h.response({
      status: 'success',
      message: 'Successfully obtained the song',
      data: {
        song,
      },
    });
    response.code(200);
    return response;
  }

  async putSongByIdHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const {
      title, year, genre, performer, duration,
    } = request.payload;
    const { id } = request.params;

    await this._service.editSongById(id, {
      title, year, genre, performer, duration,
    });

    return {
      status: 'success',
      message: 'Song updated successfully',
    };
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteSongById(id);
    const response = h.response({
      status: 'success',
      message: 'Song deleted succesfully',
    });
    response.code(200);
    return response;
  }
}

module.exports = SongsHandler;
