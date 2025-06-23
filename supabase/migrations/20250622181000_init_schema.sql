-- This file is part of 20Q.
--
-- Copyright (C) 2025  Trailyn Ventures, LLC
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- 20250622181000_init_schema.sql
-- Initial schema migration for 20Q Game

-- Create table: players
CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  email character varying UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT players_pkey PRIMARY KEY (id)
);

-- Create table: games
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host_player_id uuid,
  current_player_id uuid,
  secret_word character varying NOT NULL,
  status character varying DEFAULT 'waiting'::character varying,
  questions_asked integer DEFAULT 0,
  winner_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  difficulty integer,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_host_player_id_fkey FOREIGN KEY (host_player_id) REFERENCES public.players(id),
  CONSTRAINT games_current_player_id_fkey FOREIGN KEY (current_player_id) REFERENCES public.players(id),
  CONSTRAINT games_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.players(id)
);

-- Create table: game_participants
CREATE TABLE public.game_participants (
  game_id uuid NOT NULL,
  player_id uuid NOT NULL,
  joined_at timestamp without time zone DEFAULT now(),
  CONSTRAINT game_participants_pkey PRIMARY KEY (game_id, player_id),
  CONSTRAINT game_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id),
  CONSTRAINT game_participants_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);

-- Create table: game_questions
CREATE TABLE public.game_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id uuid,
  player_id uuid,
  question text NOT NULL,
  answer boolean,
  question_number integer,
  asked_at timestamp without time zone DEFAULT now(),
  CONSTRAINT game_questions_pkey PRIMARY KEY (id),
  CONSTRAINT game_questions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id),
  CONSTRAINT game_questions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);

-- Create table: player_stats
CREATE TABLE public.player_stats (
  player_id uuid NOT NULL,
  games_won integer DEFAULT 0,
  games_played integer DEFAULT 0,
  total_questions_asked integer DEFAULT 0,
  average_questions_to_win double precision,
  win_rate double precision,
  CONSTRAINT player_stats_pkey PRIMARY KEY (player_id),
  CONSTRAINT player_stats_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);

-- Create table: player_stats_difficulty
CREATE TABLE public.player_stats_difficulty (
  player_id uuid NOT NULL,
  difficulty integer NOT NULL,
  games_won integer DEFAULT 0,
  games_played integer DEFAULT 0,
  total_questions_asked integer DEFAULT 0,
  average_questions_to_win double precision,
  win_rate double precision,
  CONSTRAINT player_stats_difficulty_pkey PRIMARY KEY (player_id, difficulty),
  CONSTRAINT player_stats_difficulty_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);

-- Create table: word_bank
CREATE TABLE public.word_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  difficulty integer,
  is_active boolean DEFAULT true,
  CONSTRAINT word_bank_pkey PRIMARY KEY (id)
);