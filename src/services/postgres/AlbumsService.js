const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapAlbumDBToModel, mapSongDBToModel } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');
const ClientError = require('../../exceptions/ClientError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add album');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapAlbumDBToModel);
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const albumResult = await this._pool.query(albumQuery);

    const songsQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songsResult = await this._pool.query(songsQuery);

    if (!albumResult.rowCount) {
      throw new NotFoundError('Album not found');
    }

    const album = {
      ...albumResult.rows[0],
      coverUrl: albumResult.rows[0].cover,
      songs: songsResult.rows.map(mapSongDBToModel),
    };
    delete album.cover;
    return album;
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update album. ID not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete album. Id not found');
    }
  }

  async updateAlbumCoverById(id, cover) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2',
      values: [cover, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update album cover. ID not found');
    }
  }

  async verifyAlbumAvailability(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album id not found');
    }
  }

  async addAlbumLikeById(userId, albumId) {
    const id = `user-album-like-${nanoid(16)}`;
    await this.getAlbumById(albumId);
    const isLikeExist = await this.verifyAlbumLikeAvailability(userId, albumId);

    if (isLikeExist) {
      throw new ClientError('Album have been liked by user.');
    }

    const query = {
      text: 'INSERT INTO user_album_likes(id, user_id, album_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to add like to album');
    }
  }

  async getAlbumLikesById(id) {
    const query = {
      text: 'SELECT COUNT(*)  AS count FROM user_album_likes WHERE album_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    return result.rows[0].count;
  }

  async deleteAlbumLikeById(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to delete like');
    }
  }

  async verifyAlbumLikeAvailability(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      return false;
    }

    return true;
  }
}

module.exports = AlbumsService;
